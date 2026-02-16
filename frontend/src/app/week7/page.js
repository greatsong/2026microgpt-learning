'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/layout/Breadcrumb';

// ── 데이터셋 ──
const DATASETS = [
    { name: 'AND 게이트', inputs: [[0, 0], [0, 1], [1, 0], [1, 1]], targets: [0, 0, 0, 1], emoji: '🔗', simple: true },
    { name: 'OR 게이트', inputs: [[0, 0], [0, 1], [1, 0], [1, 1]], targets: [0, 1, 1, 1], emoji: '⚡', simple: true },
    { name: 'XOR 게이트', inputs: [[0, 0], [0, 1], [1, 0], [1, 1]], targets: [0, 1, 1, 0], emoji: '🔀', simple: false },
];

const sigmoid = (x) => 1 / (1 + Math.exp(-Math.max(-10, Math.min(10, x))));
const sigmoidDeriv = (o) => o * (1 - o);

// ── 심플 퍼셉트론 (AND/OR) ──
function initSimple() {
    const r = () => (Math.random() - 0.5) * 2;
    return { w: [r(), r()], b: r() };
}

function forwardSimple(inp, w) {
    const z = w.b + inp[0] * w.w[0] + inp[1] * w.w[1];
    return { output: sigmoid(z) };
}

function trainStepSimple(dataset, w, lr) {
    const { inputs, targets } = dataset;
    let totalLoss = 0;
    let dW = [0, 0], dB = 0;
    for (let s = 0; s < inputs.length; s++) {
        const inp = inputs[s];
        const { output } = forwardSimple(inp, w);
        const error = output - targets[s];
        totalLoss += 0.5 * error * error;
        const dOut = error * sigmoidDeriv(output);
        dB += dOut;
        dW[0] += dOut * inp[0];
        dW[1] += dOut * inp[1];
    }
    const n = inputs.length;
    const gradients = {
        dW: [dW[0] / n, dW[1] / n],
        dB: dB / n,
    };
    return {
        newWeights: { w: [w.w[0] - lr * gradients.dW[0], w.w[1] - lr * gradients.dW[1]], b: w.b - lr * gradients.dB },
        loss: totalLoss / n,
        gradients,
    };
}

// ── 2-레이어 네트워크 (XOR) ──
function initDeep() {
    const r = () => (Math.random() - 0.5) * 2;
    return {
        wIH: [[r(), r(), r()], [r(), r(), r()]],
        bH: [r(), r(), r()],
        wHO: [r(), r(), r()],
        bO: r(),
    };
}

function forwardDeep(inp, w) {
    const hidden = w.bH.map((b, j) =>
        sigmoid(b + inp.reduce((s, v, i) => s + v * w.wIH[i][j], 0))
    );
    const outRaw = w.bO + hidden.reduce((s, h, j) => s + h * w.wHO[j], 0);
    return { hidden, output: sigmoid(outRaw) };
}

function trainStepDeep(dataset, w, lr) {
    const { inputs, targets } = dataset;
    let totalLoss = 0;
    const dWIH = [[0, 0, 0], [0, 0, 0]], dBH = [0, 0, 0], dWHO = [0, 0, 0];
    let dBO = 0;
    for (let s = 0; s < inputs.length; s++) {
        const inp = inputs[s];
        const { hidden, output } = forwardDeep(inp, w);
        const error = output - targets[s];
        totalLoss += 0.5 * error * error;
        const dOut = error * sigmoidDeriv(output);
        dBO += dOut;
        for (let j = 0; j < 3; j++) {
            dWHO[j] += dOut * hidden[j];
            const dH = dOut * w.wHO[j] * sigmoidDeriv(hidden[j]);
            dBH[j] += dH;
            for (let i = 0; i < 2; i++) dWIH[i][j] += dH * inp[i];
        }
    }
    const n = inputs.length;
    const gradients = {
        dWIH: [[dWIH[0][0] / n, dWIH[0][1] / n, dWIH[0][2] / n], [dWIH[1][0] / n, dWIH[1][1] / n, dWIH[1][2] / n]],
        dBH: [dBH[0] / n, dBH[1] / n, dBH[2] / n],
        dWHO: [dWHO[0] / n, dWHO[1] / n, dWHO[2] / n],
        dBO: dBO / n,
    };
    const nw = JSON.parse(JSON.stringify(w));
    nw.bO -= lr * gradients.dBO;
    for (let j = 0; j < 3; j++) {
        nw.wHO[j] -= lr * gradients.dWHO[j];
        nw.bH[j] -= lr * gradients.dBH[j];
        for (let i = 0; i < 2; i++) nw.wIH[i][j] -= lr * gradients.dWIH[i][j];
    }
    return { newWeights: nw, loss: totalLoss / n, gradients };
}

// ── 단계별 상세 모드 상수 ──
const PHASE_FORWARD = 'forward';
const PHASE_LOSS = 'loss';
const PHASE_BACKWARD = 'backward';
const PHASE_UPDATE = 'update';
const PHASE_IDLE = 'idle';

// ── 메인 ──
export default function Week7Page() {
    const router = useRouter();
    const canvasRef = useRef(null);

    const [datasetIdx, setDatasetIdx] = useState(2); // XOR by default
    const [lr, setLr] = useState(0.5);
    const [epoch, setEpoch] = useState(0);
    const [lossHistory, setLossHistory] = useState([]);
    const [isTraining, setIsTraining] = useState(false);
    const [showBackprop, setShowBackprop] = useState(false);
    const [gradients, setGradients] = useState(null); // 그래디언트 값 저장
    const [detailPhase, setDetailPhase] = useState(PHASE_IDLE); // 상세 단계
    const [detailLoss, setDetailLoss] = useState(null); // 상세 모드 Loss 값
    const [isDetailRunning, setIsDetailRunning] = useState(false); // 상세 애니메이션 진행 중
    const [forwardProgress, setForwardProgress] = useState(0); // forward arrow animation 0~1
    const [backwardProgress, setBackwardProgress] = useState(0); // backward arrow animation 0~1
    const [showDeepDive, setShowDeepDive] = useState(false);
    const trainRef = useRef(null);

    const dataset = DATASETS[datasetIdx];
    const isSimple = dataset.simple;

    // Weights state — separate for simple vs deep
    const [simpleW, setSimpleW] = useState({ w: [0, 0], b: 0 });
    const [deepW, setDeepW] = useState({
        wIH: [[0, 0, 0], [0, 0, 0]],
        bH: [0, 0, 0],
        wHO: [0, 0, 0],
        bO: 0
    });

    // Hydration fix: Initialize random weights only on client
    useEffect(() => {
        setSimpleW(initSimple());
        setDeepW(initDeep());
    }, []);

    const weights = isSimple ? simpleW : deepW;
    const setWeights = isSimple ? setSimpleW : setDeepW;
    const forwardFn = isSimple ? forwardSimple : forwardDeep;
    const trainFn = isSimple ? trainStepSimple : trainStepDeep;

    // Predictions
    const predictions = dataset.inputs.map((inp) => forwardFn(inp, weights));
    const lastLoss = lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : null;
    const isConverged = lastLoss !== null && lastLoss < 0.01;

    // ── Network Canvas ──
    const drawNetwork = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const logicalWidth = 480;
        const logicalHeight = isSimple ? 200 : 320;

        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        canvas.style.width = `${logicalWidth}px`;
        canvas.style.height = `${logicalHeight}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const W = logicalWidth, H = logicalHeight;
        ctx.clearRect(0, 0, W, H);

        // 단계별 상세 모드에서 phase 배너 그리기
        if (detailPhase !== PHASE_IDLE) {
            const phaseLabels = {
                [PHASE_FORWARD]: { text: 'Forward Pass  >', color: 'rgba(96,165,250,0.15)', textColor: '#60a5fa' },
                [PHASE_LOSS]: { text: 'Loss 계산  L = 1/2(y - t)^2', color: 'rgba(251,191,36,0.15)', textColor: '#fbbf24' },
                [PHASE_BACKWARD]: { text: 'Backward Pass  <', color: 'rgba(251,146,36,0.15)', textColor: '#fb923c' },
                [PHASE_UPDATE]: { text: 'w = w - lr * grad  (가중치 업데이트)', color: 'rgba(16,185,129,0.15)', textColor: '#10b981' },
            };
            const pl = phaseLabels[detailPhase];
            if (pl) {
                ctx.fillStyle = pl.color;
                ctx.fillRect(0, 0, W, 28);
                ctx.fillStyle = pl.textColor;
                ctx.font = 'bold 12px "Outfit", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(pl.text, W / 2, 18);
            }
        }

        const drawNode = (x, y, label, color) => {
            ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2);
            ctx.fillStyle = `${color}33`; ctx.fill();
            ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 12px "Outfit", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(label, x, y);
        };

        const drawEdge = (x1, y1, x2, y2, w, backprop, gradValue) => {
            const alpha = Math.min(Math.abs(w) / 2, 1);
            const color = w > 0 ? `rgba(96,165,250,${0.2 + alpha * 0.6})` : `rgba(244,63,94,${0.2 + alpha * 0.6})`;
            ctx.beginPath(); ctx.strokeStyle = color;
            ctx.lineWidth = 1 + Math.abs(w) * 2;
            ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

            // Weight label
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
            const text = w.toFixed(2);
            ctx.font = '700 11px "JetBrains Mono", monospace';
            const tm = ctx.measureText(text);
            ctx.fillRect(mx - tm.width / 2 - 2, my - 14, tm.width + 4, 16);
            ctx.fillStyle = 'rgba(255,255,255,1.0)';
            ctx.textAlign = 'center';
            ctx.fillText(text, mx, my - 4);

            // Forward pass arrow animation (파란 화살표)
            if (detailPhase === PHASE_FORWARD && forwardProgress > 0) {
                const prog = forwardProgress;
                const ax = x1 + (x2 - x1) * prog;
                const ay = y1 + (y2 - y1) * prog;
                ctx.beginPath();
                ctx.arc(ax, ay, 5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(96,165,250,0.9)';
                ctx.fill();
                // trail
                const grad = ctx.createLinearGradient(x1, y1, ax, ay);
                grad.addColorStop(0, 'rgba(96,165,250,0.0)');
                grad.addColorStop(1, 'rgba(96,165,250,0.6)');
                ctx.beginPath(); ctx.strokeStyle = grad; ctx.lineWidth = 3;
                ctx.moveTo(x1, y1); ctx.lineTo(ax, ay); ctx.stroke();
            }

            // Backprop arrow (노란 화살표)
            if (backprop) {
                if (detailPhase === PHASE_BACKWARD && backwardProgress > 0) {
                    // 역방향 애니메이션
                    const prog = backwardProgress;
                    const ax = x2 + (x1 - x2) * prog;
                    const ay = y2 + (y1 - y2) * prog;
                    ctx.beginPath();
                    ctx.arc(ax, ay, 5, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(251,191,36,0.9)';
                    ctx.fill();
                    const grad = ctx.createLinearGradient(x2, y2, ax, ay);
                    grad.addColorStop(0, 'rgba(251,191,36,0.0)');
                    grad.addColorStop(1, 'rgba(251,191,36,0.6)');
                    ctx.beginPath(); ctx.strokeStyle = grad; ctx.lineWidth = 3;
                    ctx.moveTo(x2, y2); ctx.lineTo(ax, ay); ctx.stroke();
                } else if (detailPhase === PHASE_IDLE) {
                    // 기본 역전파 표시 (자동 훈련 시)
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath(); ctx.strokeStyle = 'rgba(251,191,36,0.9)'; ctx.lineWidth = 2;
                    ctx.moveTo(x2, y2); ctx.lineTo(x1, y1); ctx.stroke();
                    ctx.setLineDash([]);
                }
            }

            // 그래디언트 값 표시 (∂L/∂w)
            if (backprop && gradValue !== undefined && gradValue !== null) {
                const gText = `∂L/∂w=${gradValue.toFixed(3)}`;
                ctx.font = '600 9px "JetBrains Mono", monospace';
                const gTm = ctx.measureText(gText);
                const gx = mx, gy = my + 12;
                ctx.fillStyle = 'rgba(251,191,36,0.2)';
                ctx.fillRect(gx - gTm.width / 2 - 3, gy - 8, gTm.width + 6, 14);
                ctx.strokeStyle = 'rgba(251,191,36,0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(gx - gTm.width / 2 - 3, gy - 8, gTm.width + 6, 14);
                ctx.fillStyle = '#fbbf24';
                ctx.textAlign = 'center';
                ctx.fillText(gText, gx, gy + 1);
            }
        };

        const baseY = detailPhase !== PHASE_IDLE ? 14 : 0;
        const inputNodes = [{ x: 60, y: baseY + H * 0.35 }, { x: 60, y: baseY + H * 0.65 }];
        const outputNode = { x: W - 60, y: baseY + H * 0.5 };

        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('입력층', 60, baseY + 20);

        const showGrad = showBackprop && gradients;

        if (isSimple) {
            ctx.fillText('출력층', W - 60, baseY + 20);
            for (let i = 0; i < 2; i++) {
                const gVal = showGrad ? gradients.dW[i] : null;
                drawEdge(inputNodes[i].x + 18, inputNodes[i].y, outputNode.x - 18, outputNode.y, simpleW.w[i], showBackprop, gVal);
            }
            // Bias
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px monospace';
            ctx.fillText(`b=${simpleW.b.toFixed(2)}`, outputNode.x, outputNode.y + 32);
            if (showGrad) {
                ctx.fillStyle = '#fbbf24'; ctx.font = '600 9px monospace';
                ctx.fillText(`∂L/∂b=${gradients.dB.toFixed(3)}`, outputNode.x, outputNode.y + 44);
            }
        } else {
            const hiddenNodes = [
                { x: W * 0.42, y: baseY + H * 0.2 },
                { x: W * 0.42, y: baseY + H * 0.5 },
                { x: W * 0.42, y: baseY + H * 0.8 },
            ];
            ctx.fillText('은닉층', W * 0.42, baseY + 20);
            ctx.fillText('출력층', W - 60, baseY + 20);

            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 3; j++) {
                    const gVal = showGrad ? gradients.dWIH[i][j] : null;
                    drawEdge(inputNodes[i].x + 18, inputNodes[i].y, hiddenNodes[j].x - 18, hiddenNodes[j].y, deepW.wIH[i][j], showBackprop, gVal);
                }
            }
            for (let j = 0; j < 3; j++) {
                const gVal = showGrad ? gradients.dWHO[j] : null;
                drawEdge(hiddenNodes[j].x + 18, hiddenNodes[j].y, outputNode.x - 18, outputNode.y, deepW.wHO[j], showBackprop, gVal);
                drawNode(hiddenNodes[j].x, hiddenNodes[j].y, `H${j + 1}`, '#3b82f6');
            }
        }

        inputNodes.forEach((n, i) => drawNode(n.x, n.y, `X${i + 1}`, '#7c5cfc'));
        drawNode(outputNode.x, outputNode.y, 'Y', '#10b981');
    }, [isSimple, simpleW, deepW, showBackprop, gradients, detailPhase, forwardProgress, backwardProgress]);

    useEffect(() => { drawNetwork(); }, [drawNetwork]);

    // ── Auto training ──
    const STEPS_PER_TICK = 20;

    useEffect(() => {
        if (!isTraining) return;
        trainRef.current = setInterval(() => {
            setWeights((prev) => {
                let currentWeights = prev;
                let currentLoss = 0;
                let lastGrads = null;

                for (let i = 0; i < STEPS_PER_TICK; i++) {
                    const { newWeights, loss, gradients: g } = trainFn(dataset, currentWeights, lr);
                    currentWeights = newWeights;
                    currentLoss = loss;
                    lastGrads = g;
                }

                setEpoch((e) => e + STEPS_PER_TICK);
                setLossHistory((h) => { const next = [...h, currentLoss]; return next.length > 200 ? next.slice(-200) : next; });
                setGradients(lastGrads);

                setShowBackprop(true);
                setTimeout(() => setShowBackprop(false), 150);

                return currentWeights;
            });
        }, 100);
        return () => clearInterval(trainRef.current);
    }, [isTraining, dataset, lr, trainFn]);

    const handleStepOnce = () => {
        setWeights((prev) => {
            const { newWeights, loss, gradients: g } = trainFn(dataset, prev, lr);
            setEpoch((e) => e + 1);
            setLossHistory((h) => [...h, loss]);
            setGradients(g);
            setShowBackprop(true);
            setTimeout(() => setShowBackprop(false), 400);
            return newWeights;
        });
    };

    // ── 1스텝 상세 (Forward -> Loss -> Backward -> Update 애니메이션) ──
    const handleStepDetailed = useCallback(() => {
        if (isDetailRunning || isTraining) return;
        setIsDetailRunning(true);

        // 1) Forward pass phase
        setDetailPhase(PHASE_FORWARD);
        setShowBackprop(false);
        setGradients(null);

        // Forward animation (0 -> 1)
        let fStart = null;
        const fDuration = 800;
        const animateForward = (ts) => {
            if (!fStart) fStart = ts;
            const prog = Math.min((ts - fStart) / fDuration, 1);
            setForwardProgress(prog);
            if (prog < 1) {
                requestAnimationFrame(animateForward);
            } else {
                // 2) Loss phase
                setForwardProgress(0);
                setDetailPhase(PHASE_LOSS);

                // 현재 가중치로 loss 미리 계산해서 표시
                const currentW = isSimple ? simpleW : deepW;
                const { loss } = trainFn(dataset, currentW, lr);
                setDetailLoss(loss);

                setTimeout(() => {
                    // 3) Backward pass phase
                    setDetailPhase(PHASE_BACKWARD);
                    setDetailLoss(null);

                    // 그래디언트 계산 (아직 가중치는 안 바꿈)
                    const { gradients: g } = trainFn(dataset, currentW, lr);
                    setGradients(g);
                    setShowBackprop(true);

                    let bStart = null;
                    const bDuration = 800;
                    const animateBackward = (ts2) => {
                        if (!bStart) bStart = ts2;
                        const prog2 = Math.min((ts2 - bStart) / bDuration, 1);
                        setBackwardProgress(prog2);
                        if (prog2 < 1) {
                            requestAnimationFrame(animateBackward);
                        } else {
                            setBackwardProgress(0);

                            setTimeout(() => {
                                // 4) Update phase
                                setDetailPhase(PHASE_UPDATE);

                                setTimeout(() => {
                                    // 실제로 가중치 업데이트
                                    if (isSimple) {
                                        setSimpleW((prev) => {
                                            const { newWeights, loss: l, gradients: g2 } = trainStepSimple(dataset, prev, lr);
                                            setEpoch((e) => e + 1);
                                            setLossHistory((h) => [...h, l]);
                                            setGradients(g2);
                                            return newWeights;
                                        });
                                    } else {
                                        setDeepW((prev) => {
                                            const { newWeights, loss: l, gradients: g2 } = trainStepDeep(dataset, prev, lr);
                                            setEpoch((e) => e + 1);
                                            setLossHistory((h) => [...h, l]);
                                            setGradients(g2);
                                            return newWeights;
                                        });
                                    }

                                    setTimeout(() => {
                                        setDetailPhase(PHASE_IDLE);
                                        setShowBackprop(false);
                                        setGradients(null);
                                        setIsDetailRunning(false);
                                    }, 600);
                                }, 400);
                            }, 200);
                        }
                    };
                    requestAnimationFrame(animateBackward);
                }, 700);
            }
        };
        requestAnimationFrame(animateForward);
    }, [isDetailRunning, isTraining, isSimple, simpleW, deepW, dataset, lr, trainFn]);

    const handleToggleTrain = () => {
        if (isTraining) { clearInterval(trainRef.current); setIsTraining(false); }
        else setIsTraining(true);
    };

    const handleReset = () => {
        clearInterval(trainRef.current); setIsTraining(false);
        if (isSimple) setSimpleW(initSimple());
        else setDeepW(initDeep());
        setEpoch(0); setLossHistory([]); setShowBackprop(false);
        setGradients(null); setDetailPhase(PHASE_IDLE); setDetailLoss(null);
        setIsDetailRunning(false); setForwardProgress(0); setBackwardProgress(0);
    };

    const handleDatasetChange = (idx) => {
        clearInterval(trainRef.current); setIsTraining(false);
        setDatasetIdx(idx);
        setEpoch(0); setLossHistory([]); setShowBackprop(false);
        setGradients(null); setDetailPhase(PHASE_IDLE); setDetailLoss(null);
        setIsDetailRunning(false); setForwardProgress(0); setBackwardProgress(0);
        if (DATASETS[idx].simple) setSimpleW(initSimple());
        else setDeepW(initDeep());
    };

    // ── Manual weight update helpers ──
    const updateSimpleWeight = (idx, val) => {
        setSimpleW((prev) => {
            const nw = { ...prev, w: [...prev.w] };
            nw.w[idx] = parseFloat(val);
            return nw;
        });
    };
    const updateSimpleBias = (val) => {
        setSimpleW((prev) => ({ ...prev, b: parseFloat(val) }));
    };
    const updateDeepWeightIH = (i, j, val) => {
        setDeepW((prev) => {
            const nw = JSON.parse(JSON.stringify(prev));
            nw.wIH[i][j] = parseFloat(val);
            return nw;
        });
    };
    const updateDeepWeightHO = (j, val) => {
        setDeepW((prev) => {
            const nw = JSON.parse(JSON.stringify(prev));
            nw.wHO[j] = parseFloat(val);
            return nw;
        });
    };
    const updateDeepBiasH = (j, val) => {
        setDeepW((prev) => {
            const nw = JSON.parse(JSON.stringify(prev));
            nw.bH[j] = parseFloat(val);
            return nw;
        });
    };
    const updateDeepBiasO = (val) => {
        setDeepW((prev) => {
            const nw = JSON.parse(JSON.stringify(prev));
            nw.bO = parseFloat(val);
            return nw;
        });
    };

    // ── 단계별 상세 모드 상태 라벨 ──
    const phaseStatusLabel = {
        [PHASE_FORWARD]: '순전파 진행 중...',
        [PHASE_LOSS]: `Loss 계산: ${detailLoss !== null ? detailLoss.toFixed(6) : '...'}`,
        [PHASE_BACKWARD]: '역전파 (그래디언트 전파 중)...',
        [PHASE_UPDATE]: '가중치 업데이트 완료!',
        [PHASE_IDLE]: '',
    };

    return (
        <div style={styles.container}>
            {/* ── 좌측 컨트롤 ── */}
            <div style={styles.leftPanel}>
                <Breadcrumb
                    items={[{ label: '7주차 인트로', href: '/week7/intro' }]}
                    current="역전파 훈련소"
                />
                <div style={styles.header}>
                    <h2 style={styles.weekTitle}>7주차</h2>
                    <h1 style={styles.moduleTitle}>
                        <span className="text-gradient">🔄 역전파 훈련소</span>
                    </h1>
                    <p style={styles.description}>
                        신경망을 직접 구성하고 훈련시켜보세요!<br />
                        AND/OR은 퍼셉트론<span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>(가장 간단한 신경망, 뉴런 하나로 이루어진 모델)</span>, XOR은 은닉층이 필요!
                    </p>
                </div>

                {/* 데이터셋 + 구조 표시 */}
                <div className="glass-card" style={styles.card}>
                    <label className="label-cosmic">📊 데이터셋 선택</label>
                    <div style={styles.btnRow}>
                        {DATASETS.map((ds, idx) => (
                            <button
                                key={idx}
                                className={idx === datasetIdx ? 'btn-nova' : 'btn-ghost'}
                                style={styles.dsBtn}
                                onClick={() => handleDatasetChange(idx)}
                            >
                                {ds.emoji} {ds.name}
                            </button>
                        ))}
                    </div>
                    <div style={styles.archBanner}>
                        {isSimple ? (
                            <>
                                <span style={{ fontSize: '1.1rem' }}>🧩</span>
                                <span>퍼셉트론 (은닉층 없음) — 2개 가중치 + 1개 편향</span>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: '1.1rem' }}>🧠</span>
                                <span>2-레이어 (은닉층 3개) — XOR은 비선형이라 은닉층 필수!</span>
                            </>
                        )}
                    </div>
                </div>

                {/* 학습률 */}
                <div className="glass-card" style={styles.card}>
                    <label className="label-cosmic">🎚️ 학습률</label>
                    <div style={styles.sliderRow}>
                        <span style={styles.sliderLabel}>0.01</span>
                        <input type="range" className="slider-cosmic" min={0.01} max={1.0} step={0.01}
                            value={lr} onChange={(e) => setLr(parseFloat(e.target.value))} style={{ flex: 1 }} />
                        <span style={styles.sliderLabel}>1.00</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ color: lr > 3 ? '#f43f5e' : '#10b981', fontWeight: 800, fontFamily: 'monospace', fontSize: '1.1rem' }}>
                            {lr.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* 학습 컨트롤 */}
                <div className="glass-card" style={styles.card}>
                    <label className="label-cosmic">🎮 학습 제어</label>
                    <div style={styles.btnRow}>
                        <button className="btn-nova" onClick={handleStepOnce} disabled={isTraining || isDetailRunning} style={{ flex: 1 }}>
                            ▶ 1스텝
                        </button>
                        <button
                            className="btn-nova"
                            onClick={handleStepDetailed}
                            disabled={isTraining || isDetailRunning}
                            style={{
                                flex: 1,
                                background: isDetailRunning ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.15)',
                                border: '1px solid rgba(251,191,36,0.4)',
                                color: '#fbbf24',
                            }}
                        >
                            🔍 1스텝 상세
                        </button>
                    </div>
                    <div style={styles.btnRow}>
                        <button
                            className={isTraining ? 'btn-ghost' : 'btn-nova'}
                            onClick={handleToggleTrain}
                            disabled={isDetailRunning}
                            style={{ flex: 1, background: isTraining ? 'rgba(244,63,94,0.2)' : undefined }}
                        >
                            {isTraining ? '⏸ 멈춤' : '⏩ 자동'}
                        </button>
                        <button className="btn-ghost" onClick={handleReset} style={{ flex: 1 }}>
                            🔄 리셋
                        </button>
                    </div>

                    {/* 상세 모드 단계 표시 */}
                    {detailPhase !== PHASE_IDLE && (
                        <div style={styles.phaseBanner}>
                            <div style={styles.phaseSteps}>
                                <PhaseStep label="Forward" active={detailPhase === PHASE_FORWARD} done={[PHASE_LOSS, PHASE_BACKWARD, PHASE_UPDATE].includes(detailPhase)} color="#60a5fa" />
                                <span style={styles.phaseArrow}> {'>'} </span>
                                <PhaseStep label="Loss" active={detailPhase === PHASE_LOSS} done={[PHASE_BACKWARD, PHASE_UPDATE].includes(detailPhase)} color="#fbbf24" />
                                <span style={styles.phaseArrow}> {'>'} </span>
                                <PhaseStep label="Backward" active={detailPhase === PHASE_BACKWARD} done={[PHASE_UPDATE].includes(detailPhase)} color="#fb923c" />
                                <span style={styles.phaseArrow}> {'>'} </span>
                                <PhaseStep label="Update" active={detailPhase === PHASE_UPDATE} done={false} color="#10b981" />
                            </div>
                            <div style={styles.phaseDescription}>{phaseStatusLabel[detailPhase]}</div>
                        </div>
                    )}

                    <div style={styles.statsRow}>
                        <div style={styles.statBox}>
                            <span style={styles.statLabel}>Epoch</span>
                            <span style={styles.statValue}>{epoch}</span>
                        </div>
                        <div style={styles.statBox}>
                            <span style={styles.statLabel}>Loss</span>
                            <span style={{ ...styles.statValue, color: isConverged ? '#10b981' : lastLoss > 0.1 ? '#f43f5e' : '#fbbf24' }}>
                                {lastLoss !== null ? lastLoss.toFixed(6) : '—'}
                            </span>
                        </div>
                        <div style={styles.statBox}>
                            <span style={styles.statLabel}>상태</span>
                            <span style={{ fontSize: '1.1rem' }}>
                                {isConverged ? '🎉' : epoch === 0 ? '⏳' : isTraining ? '🏃' : isDetailRunning ? '🔍' : '⏸️'}
                            </span>
                        </div>
                    </div>
                    {isConverged && (
                        <div style={styles.successBanner}>🎉 수렴 완료! {dataset.name} 학습 성공!</div>
                    )}
                </div>

                {/* 수동 가중치 편집 */}
                <div className="glass-card" style={styles.card}>
                    <label className="label-cosmic">🔧 수동 가중치 조절</label>
                    {isSimple ? (
                        <div style={styles.weightSliders}>
                            <WeightSlider label="W₁" value={simpleW.w[0]} onChange={(v) => updateSimpleWeight(0, v)} />
                            <WeightSlider label="W₂" value={simpleW.w[1]} onChange={(v) => updateSimpleWeight(1, v)} />
                            <WeightSlider label="b" value={simpleW.b} onChange={(v) => updateSimpleBias(v)} />
                            <p style={styles.hint}>
                                💡 AND: W₁, W₂ ≈ 큰 양수, b ≈ 큰 음수<br />
                                💡 OR: W₁, W₂ ≈ 큰 양수, b ≈ 작은 음수
                            </p>
                        </div>
                    ) : (
                        <div style={styles.weightSliders}>
                            <span style={styles.weightGroup}>입력→은닉 (W_IH)</span>
                            {[0, 1].map((i) => [0, 1, 2].map((j) => (
                                <WeightSlider key={`ih${i}${j}`} label={`X${i + 1}→H${j + 1}`}
                                    value={deepW.wIH[i][j]} onChange={(v) => updateDeepWeightIH(i, j, v)} />
                            )))}
                            <span style={styles.weightGroup}>은닉 편향 (b_H)</span>
                            {[0, 1, 2].map((j) => (
                                <WeightSlider key={`bh${j}`} label={`bH${j + 1}`}
                                    value={deepW.bH[j]} onChange={(v) => updateDeepBiasH(j, v)} />
                            ))}
                            <span style={styles.weightGroup}>은닉→출력 (W_HO)</span>
                            {[0, 1, 2].map((j) => (
                                <WeightSlider key={`ho${j}`} label={`H${j + 1}→Y`}
                                    value={deepW.wHO[j]} onChange={(v) => updateDeepWeightHO(j, v)} />
                            ))}
                            <WeightSlider label="bO" value={deepW.bO} onChange={(v) => updateDeepBiasO(v)} />
                        </div>
                    )}
                </div>

                {/* ── Theory Section with Chain Rule ── */}
                <div className="glass-card" style={styles.card}>
                    <label className="label-cosmic">🤖 딥러닝(Deep Learning)의 학습 원리</label>
                    <div style={{ ...styles.description, fontSize: '0.85rem' }}>
                        <p style={{ marginBottom: 10 }}>
                            <strong>1. 모든 신경망의 기초 (Backpropagation)</strong><br />
                            GPT, 알파고, 자율주행 차 등 모든 현대 인공지능은 <strong>역전파(Backpropagation)</strong> 알고리즘을 통해 학습합니다.
                            &quot;정답과 예측의 오차(Loss)를 줄이는 방향으로 가중치를 수정한다&quot;는 원리는 모두 동일합니다.
                        </p>
                        <p style={{ marginBottom: 10 }}>
                            <strong>2. 규모의 확장 (Scale)</strong><br />
                            여러분이 지금 만든 신경망은 뉴런이 몇 개 없지만, 최신 LLM은 수천억 개의 뉴런(파라미터)을 가집니다.
                            하지만 그 거대한 모델을 학습시키는 방법도 결국은 이 <strong>기울기(Gradient)를 따라가는 것</strong>입니다.
                        </p>
                    </div>
                </div>

                {/* ── Chain Rule 상세 설명 섹션 ── */}
                <div className="glass-card" style={styles.card}>
                    <label className="label-cosmic">📐 체인룰 (Chain Rule) 이해하기</label>
                    <div style={{ ...styles.description, fontSize: '0.85rem' }}>
                        <p style={{ marginBottom: 10 }}>
                            역전파의 핵심은 <strong>체인룰(연쇄 법칙)</strong>입니다.
                            합성함수의 미분을 &quot;체인(사슬)&quot;처럼 연결해서 구합니다.
                        </p>

                        {/* 쉬운 예시 */}
                        <div style={styles.chainRuleBox}>
                            <div style={styles.chainRuleTitle}>쉬운 예시: 빵 가격 계산</div>
                            <p style={{ marginBottom: 6, lineHeight: 1.7 }}>
                                밀가루 가격이 올라가면 빵 가격은 얼마나 오를까?
                            </p>
                            <div style={styles.chainRuleFormula}>
                                밀가루 → 반죽 → 빵 가격
                            </div>
                            <div style={styles.chainRuleFormula}>
                                <span style={{ color: '#fbbf24' }}>∂(빵가격)/∂(밀가루)</span> = <span style={{ color: '#60a5fa' }}>∂(빵가격)/∂(반죽)</span> x <span style={{ color: '#fb923c' }}>∂(반죽)/∂(밀가루)</span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 6 }}>
                                각 단계의 변화율을 곱하면 전체 변화율을 알 수 있습니다!
                            </p>
                        </div>

                        {/* 신경망에서의 예시 */}
                        <div style={styles.chainRuleBox}>
                            <div style={styles.chainRuleTitle}>신경망에서의 체인룰</div>
                            <div style={styles.chainRuleFormula}>
                                y = sigmoid(w * x + b)
                            </div>
                            <div style={styles.chainRuleFormula}>
                                Loss = 1/2 * (y - target)^2
                            </div>
                            <div style={{ ...styles.chainRuleFormula, marginTop: 8 }}>
                                <span style={{ color: '#fbbf24' }}>∂L/∂w</span> = <span style={{ color: '#f43f5e' }}>∂L/∂y</span> x <span style={{ color: '#60a5fa' }}>∂y/∂z</span> x <span style={{ color: '#fb923c' }}>∂z/∂w</span>
                            </div>
                            <div style={styles.chainRuleDetail}>
                                <div><span style={{ color: '#f43f5e' }}>∂L/∂y</span> = (y - target) <span style={{ color: 'var(--text-dim)' }}>... Loss의 미분</span></div>
                                <div><span style={{ color: '#60a5fa' }}>∂y/∂z</span> = y(1 - y) <span style={{ color: 'var(--text-dim)' }}>... sigmoid의 미분</span></div>
                                <div><span style={{ color: '#fb923c' }}>∂z/∂w</span> = x <span style={{ color: 'var(--text-dim)' }}>... z = wx + b이므로</span></div>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 8 }}>
                                이 세 값을 곱하면 &quot;가중치 w를 얼마나 바꿔야 하는지&quot;를 알 수 있습니다.
                                위의 &quot;1스텝 상세&quot; 버튼을 눌러 실제 그래디언트 값을 확인해보세요!
                            </p>
                        </div>

                        {/* 다층에서의 체인룰 */}
                        <div style={styles.chainRuleBox}>
                            <div style={styles.chainRuleTitle}>다층 네트워크 (XOR)</div>
                            <p style={{ lineHeight: 1.7, fontSize: '0.8rem' }}>
                                은닉층이 있으면 체인이 더 길어집니다:
                            </p>
                            <div style={styles.chainRuleFormula}>
                                <span style={{ color: '#fbbf24' }}>∂L/∂w_ih</span> = <span style={{ color: '#f43f5e' }}>∂L/∂y</span> x <span style={{ color: '#10b981' }}>∂y/∂h</span> x <span style={{ color: '#60a5fa' }}>∂h/∂z_h</span> x <span style={{ color: '#fb923c' }}>∂z_h/∂w_ih</span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 6 }}>
                                출력에서 입력 방향으로 체인을 따라가며 그래디언트를 전파합니다.
                                이것이 &quot;역(Back)전파(Propagation)&quot;라 부르는 이유입니다!
                            </p>
                        </div>
                    </div>
                </div>

                {/* 한 걸음 더: 체인 룰(Chain Rule)이란? */}
                <div style={{
                    borderRadius: 12,
                    border: '1px solid rgba(124, 92, 252, 0.2)',
                    overflow: 'hidden',
                    marginTop: 4,
                }}>
                    <button
                        onClick={() => setShowDeepDive(!showDeepDive)}
                        style={{
                            width: '100%', padding: '12px 16px',
                            background: 'rgba(124, 92, 252, 0.08)', border: 'none',
                            color: '#a78bfa', fontSize: '0.9rem', fontWeight: 600,
                            cursor: 'pointer', textAlign: 'left',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}
                    >
                        {showDeepDive ? '▼' : '▶'} 한 걸음 더: 체인 룰(Chain Rule)이란?
                    </button>
                    {showDeepDive && (
                        <div style={{
                            padding: 16, background: 'rgba(124, 92, 252, 0.04)',
                            fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7,
                            textAlign: 'left',
                        }}>
                            <p style={{ marginBottom: 8 }}>
                                <strong style={{ color: '#fbbf24' }}>체인 룰(Chain Rule)</strong>은
                                역전파(Backpropagation)의 수학적 기초입니다.
                                마치 사슬(Chain)을 따라 메시지를 전달하는 것처럼 —
                                각 연결 고리가 메시지를 조금씩 변형하면서 전달합니다.
                            </p>
                            <p style={{ marginBottom: 8 }}>
                                <strong style={{ color: '#34d399' }}>수학적 표현</strong> —
                                합성함수 f(g(x))의 미분 = f&apos;(g(x)) &times; g&apos;(x).
                                즉, 바깥 함수의 미분과 안쪽 함수의 미분을 곱하면 됩니다.
                            </p>
                            <p>
                                <strong style={{ color: '#f87171' }}>왜 중요한가?</strong> —
                                체인 룰 덕분에 딥러닝이 가능합니다.
                                층이 아무리 깊어도, 각 가중치가 최종 출력에 미치는 영향을
                                체인 룰을 통해 정확히 계산할 수 있기 때문입니다.
                                이것이 바로 수백 층짜리 신경망도 학습시킬 수 있는 비결입니다!
                            </p>
                        </div>
                    )}
                </div>

                <button className="btn-ghost" onClick={() => router.push('/hub')} style={{ marginTop: 4 }}>
                    ← 허브로 돌아가기
                </button>
            </div>

            {/* ── 우측 시각화 ── */}
            <div style={styles.rightPanel}>
                {/* 신경망 구조 */}
                <div style={styles.vizCard}>
                    <div style={styles.vizHeader}>
                        <span style={styles.vizTitle}>🧠 신경망 구조</span>
                        <span style={styles.vizSub}>
                            {detailPhase !== PHASE_IDLE
                                ? phaseStatusLabel[detailPhase]
                                : showBackprop
                                    ? '🔙 역전파 중... (그래디언트 표시)'
                                    : '🔵양수 🔴음수 굵기=크기'}
                        </span>
                    </div>
                    <canvas ref={canvasRef} width={480} height={isSimple ? 200 : 320}
                        style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-sm)' }} />
                </div>

                {/* 예측 결과 */}
                <div style={styles.vizCard}>
                    <div style={styles.vizHeader}>
                        <span style={styles.vizTitle}>📋 예측 결과</span>
                    </div>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>X1</th>
                                <th style={styles.th}>X2</th>
                                <th style={styles.th}>정답</th>
                                <th style={styles.th}>예측</th>
                                <th style={styles.th}>✓</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataset.inputs.map((inp, idx) => {
                                const pred = predictions[idx];
                                const target = dataset.targets[idx];
                                const correct = pred && Math.abs(pred.output - target) < 0.3;
                                return (
                                    <tr key={idx}>
                                        <td style={styles.td}>{inp[0]}</td>
                                        <td style={styles.td}>{inp[1]}</td>
                                        <td style={{ ...styles.td, fontWeight: 700 }}>{target}</td>
                                        <td style={{ ...styles.td, fontFamily: 'monospace', color: correct ? '#10b981' : '#f43f5e' }}>
                                            {pred ? pred.output.toFixed(3) : '—'}
                                        </td>
                                        <td style={styles.td}>{correct ? '✅' : '❌'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Loss 그래프 */}
                <div style={styles.vizCard}>
                    <div style={styles.vizHeader}>
                        <span style={styles.vizTitle}>📉 Loss 그래프</span>
                        <span style={styles.vizSub}>{lossHistory.length}스텝</span>
                    </div>
                    <LossChart history={lossHistory} />
                </div>

                {/* 결정 경계 */}
                <div style={styles.vizCard}>
                    <div style={styles.vizHeader}>
                        <span style={styles.vizTitle}>🗺️ 결정 경계<span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 400 }}> (직선/곡선으로 데이터를 두 그룹으로 나누는 경계선)</span></span>
                        <span style={styles.vizSub}>신경망이 보는 세상</span>
                    </div>
                    <DecisionBoundary weights={weights} dataset={dataset} forwardFn={forwardFn} />
                </div>
            </div>
        </div>
    );
}

// ── Phase Step 인디케이터 ──
function PhaseStep({ label, active, done, color }) {
    return (
        <span style={{
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: active ? `${color}33` : done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
            color: active ? color : done ? '#10b981' : 'var(--text-dim)',
            border: active ? `1px solid ${color}` : '1px solid transparent',
            transition: 'all 0.3s ease',
        }}>
            {done ? '✓ ' : ''}{label}
        </span>
    );
}

// ── 가중치 슬라이더 ──
function WeightSlider({ label, value, onChange }) {
    return (
        <div style={styles.wRow}>
            <span style={styles.wLabel}>{label}</span>
            <input type="range" className="slider-cosmic" min={-5} max={5} step={0.05}
                value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1 }} />
            <span style={{ ...styles.wVal, color: value > 0 ? '#60a5fa' : value < 0 ? '#f43f5e' : '#888' }}>
                {value.toFixed(2)}
            </span>
        </div>
    );
}

// ── Loss Chart ──
function LossChart({ history }) {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const logicalWidth = 480;
        const logicalHeight = 140;

        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        canvas.style.width = `${logicalWidth}px`;
        canvas.style.height = `${logicalHeight}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const W = logicalWidth, H = logicalHeight;
        ctx.clearRect(0, 0, W, H);
        if (history.length < 2) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('학습을 시작하면 그래프가 나타납니다', W / 2, H / 2);
            return;
        }
        const maxLoss = Math.max(...history, 0.3);
        const pad = { top: 10, bottom: 25, left: 45, right: 10 };
        const gW = W - pad.left - pad.right, gH = H - pad.top - pad.bottom;
        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (gH * i) / 4;
            ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '10px monospace'; ctx.textAlign = 'right';
            ctx.fillText((maxLoss * (1 - i / 4)).toFixed(3), pad.left - 5, y + 4);
        }
        // Curve
        ctx.beginPath(); ctx.strokeStyle = '#7c5cfc'; ctx.lineWidth = 2;
        history.forEach((loss, i) => {
            const x = pad.left + (i / (history.length - 1)) * gW;
            const y = pad.top + (1 - loss / maxLoss) * gH;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        const lastX = pad.left + gW;
        const lastY = pad.top + (1 - history[history.length - 1] / maxLoss) * gH;
        ctx.lineTo(lastX, pad.top + gH); ctx.lineTo(pad.left, pad.top + gH); ctx.closePath();
        ctx.fillStyle = 'rgba(124,92,252,0.1)'; ctx.fill();
        ctx.beginPath(); ctx.arc(lastX, lastY, 4, 0, Math.PI * 2); ctx.fillStyle = '#fbbf24'; ctx.fill();
    }, [history]);
    return <canvas ref={canvasRef} width={480} height={140} style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-sm)' }} />;
}

// ── 결정 경계 ──
function DecisionBoundary({ weights, dataset, forwardFn }) {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const logicalSize = 200;
        canvas.width = logicalSize * dpr;
        canvas.height = logicalSize * dpr;
        canvas.style.width = '100%';
        canvas.style.maxWidth = '250px';
        canvas.style.height = 'auto';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const S = logicalSize;
        const res = 2;

        for (let px = 0; px < S; px += res) {
            for (let py = 0; py < S; py += res) {
                const { output } = forwardFn([px / S, py / S], weights);
                const r = Math.floor(244 * output + 16 * (1 - output));
                const g = Math.floor(63 * output + 185 * (1 - output));
                const b = Math.floor(94 * output + 129 * (1 - output));
                ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
                ctx.fillRect(px, py, res, res);
            }
        }
        dataset.inputs.forEach((inp, i) => {
            const px = inp[0] * (S - 40) + 20, py = inp[1] * (S - 40) + 20;
            const t = dataset.targets[i];
            ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2);
            ctx.fillStyle = t ? '#fbbf24' : '#3b82f6'; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(t.toString(), px, py);
        });
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('X1 →', S / 2, S - 5);
        ctx.save(); ctx.translate(10, S / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('X2 →', 0, 0); ctx.restore();
    }, [weights, dataset, forwardFn]);
    return <canvas ref={canvasRef} style={{ width: '100%', maxWidth: 250, height: 'auto', borderRadius: 'var(--radius-sm)', margin: '0 auto', display: 'block' }} />;
}

// ── 스타일 ──
const styles = {
    container: { display: 'flex', height: '100vh', overflow: 'hidden' },
    leftPanel: {
        width: 380, minWidth: 380, height: '100%', overflowY: 'auto', padding: 24,
        display: 'flex', flexDirection: 'column', gap: 14, borderRight: '1px solid var(--border-subtle)',
    },
    header: { marginBottom: 4 },
    weekTitle: { fontSize: '0.85rem', color: 'var(--accent-pulsar)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 },
    moduleTitle: { fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 },
    description: { fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 },
    card: { padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
    btnRow: { display: 'flex', gap: 6 },
    dsBtn: { flex: 1, fontSize: '0.78rem', padding: '8px 4px' },
    archBanner: {
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
        background: 'rgba(124,92,252,0.08)', borderRadius: 'var(--radius-sm)',
        fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600,
    },
    sliderRow: { display: 'flex', alignItems: 'center', gap: 8 },
    sliderLabel: { fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' },
    statsRow: { display: 'flex', gap: 8, marginTop: 4 },
    statBox: {
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px',
        background: 'rgba(124,92,252,0.05)', borderRadius: 'var(--radius-sm)',
    },
    statLabel: { fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 2 },
    statValue: { fontSize: '0.95rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)' },
    successBanner: {
        padding: '10px 16px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
        borderRadius: 'var(--radius-sm)', color: '#10b981', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center',
    },
    hint: { fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.6 },
    weightSliders: { display: 'flex', flexDirection: 'column', gap: 6 },
    weightGroup: { fontSize: '0.72rem', color: 'var(--accent-pulsar)', fontWeight: 700, marginTop: 4 },
    wRow: { display: 'flex', alignItems: 'center', gap: 6 },
    wLabel: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', fontFamily: 'monospace', width: 50, textAlign: 'right' },
    wVal: { fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace', width: 40, textAlign: 'right' },
    rightPanel: { flex: 1, height: '100%', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
    vizCard: { padding: 20, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' },
    vizHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    vizTitle: { fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' },
    vizSub: { fontSize: '0.75rem', color: 'var(--text-dim)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '6px 8px', fontSize: '0.75rem', color: 'var(--text-dim)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'center' },
    td: { padding: '6px 8px', fontSize: '0.82rem', color: 'var(--text-primary)', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    // Phase indicator styles
    phaseBanner: {
        padding: '10px 12px',
        background: 'rgba(124,92,252,0.06)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(124,92,252,0.2)',
    },
    phaseSteps: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 6,
        flexWrap: 'wrap',
    },
    phaseArrow: { fontSize: '0.7rem', color: 'var(--text-dim)' },
    phaseDescription: {
        textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600,
    },
    // Chain Rule styles
    chainRuleBox: {
        padding: '12px 14px',
        background: 'rgba(124,92,252,0.06)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(124,92,252,0.15)',
        marginBottom: 10,
        fontSize: '0.82rem',
        lineHeight: 1.6,
    },
    chainRuleTitle: {
        fontWeight: 800, fontSize: '0.82rem', color: 'var(--accent-pulsar)', marginBottom: 6,
    },
    chainRuleFormula: {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '0.8rem',
        color: 'var(--text-primary)',
        textAlign: 'center',
        padding: '4px 0',
        fontWeight: 600,
    },
    chainRuleDetail: {
        marginTop: 8,
        paddingLeft: 8,
        borderLeft: '2px solid rgba(124,92,252,0.3)',
        fontSize: '0.78rem',
        fontFamily: '"JetBrains Mono", monospace',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
    },
};
