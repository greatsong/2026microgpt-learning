'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';

/* ── Activation Graph (Canvas) ── */
function ActivationGraph({ activation, z, y }) {
    const canvasRef = useRef(null);

    const activationFn = useCallback((x) => {
        switch (activation) {
            case 'sigmoid': return 1 / (1 + Math.exp(-x));
            case 'relu': return Math.max(0, x);
            case 'tanh': return Math.tanh(x);
            case 'step': return x >= 0 ? 1 : 0;
            default: return 0;
        }
    }, [activation]);

    // y-axis range per function
    const getYRange = useCallback(() => {
        switch (activation) {
            case 'sigmoid': return { min: -0.2, max: 1.2 };
            case 'relu': return { min: -1, max: 6 };
            case 'tanh': return { min: -1.3, max: 1.3 };
            case 'step': return { min: -0.3, max: 1.3 };
            default: return { min: -1, max: 1 };
        }
    }, [activation]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.clientWidth;
        const H = canvas.clientHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const pad = { top: 20, right: 20, bottom: 30, left: 40 };
        const plotW = W - pad.left - pad.right;
        const plotH = H - pad.top - pad.bottom;

        const xMin = -6, xMax = 6;
        const { min: yMin, max: yMax } = getYRange();

        const toCanvasX = (v) => pad.left + ((v - xMin) / (xMax - xMin)) * plotW;
        const toCanvasY = (v) => pad.top + ((yMax - v) / (yMax - yMin)) * plotH;

        // Clear
        ctx.clearRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        for (let x = -6; x <= 6; x += 2) {
            ctx.beginPath();
            ctx.moveTo(toCanvasX(x), pad.top);
            ctx.lineTo(toCanvasX(x), pad.top + plotH);
            ctx.stroke();
        }
        const yStep = activation === 'relu' ? 1 : 0.5;
        for (let yv = Math.ceil(yMin / yStep) * yStep; yv <= yMax; yv += yStep) {
            ctx.beginPath();
            ctx.moveTo(pad.left, toCanvasY(yv));
            ctx.lineTo(pad.left + plotW, toCanvasY(yv));
            ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        // x-axis (y=0)
        if (yMin <= 0 && yMax >= 0) {
            ctx.beginPath();
            ctx.moveTo(pad.left, toCanvasY(0));
            ctx.lineTo(pad.left + plotW, toCanvasY(0));
            ctx.stroke();
        }
        // y-axis (x=0)
        ctx.beginPath();
        ctx.moveTo(toCanvasX(0), pad.top);
        ctx.lineTo(toCanvasX(0), pad.top + plotH);
        ctx.stroke();

        // Axis labels
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        for (let x = -6; x <= 6; x += 2) {
            ctx.fillText(x, toCanvasX(x), pad.top + plotH + 15);
        }
        ctx.textAlign = 'right';
        for (let yv = Math.ceil(yMin / yStep) * yStep; yv <= yMax; yv += yStep) {
            ctx.fillText(yv.toFixed(1), pad.left - 5, toCanvasY(yv) + 3);
        }

        // Draw curve
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const steps = 300;
        for (let i = 0; i <= steps; i++) {
            const xv = xMin + (xMax - xMin) * (i / steps);
            const yv = activationFn(xv);
            const cx = toCanvasX(xv);
            const cy = toCanvasY(yv);
            if (i === 0) ctx.moveTo(cx, cy);
            else ctx.lineTo(cx, cy);
        }
        ctx.stroke();

        // Vertical dashed line at z
        const clampedZ = Math.max(xMin, Math.min(xMax, z));
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(248,113,113,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(clampedZ), pad.top);
        ctx.lineTo(toCanvasX(clampedZ), pad.top + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Current point (z, y)
        const ptX = toCanvasX(clampedZ);
        const ptY = toCanvasY(activationFn(clampedZ));
        // Glow
        ctx.beginPath();
        ctx.arc(ptX, ptY, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(248,113,113,0.25)';
        ctx.fill();
        // Dot
        ctx.beginPath();
        ctx.arc(ptX, ptY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#f87171';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label near dot
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        const labelX = ptX + 10;
        const labelY = ptY - 10;
        ctx.fillText(`z=${z.toFixed(2)}`, labelX, labelY);
        ctx.fillStyle = '#22c55e';
        ctx.fillText(`y=${y.toFixed(4)}`, labelX, labelY + 14);

    }, [activation, z, y, activationFn, getYRange]);

    return (
        <div style={styles.graphContainer}>
            <h3 style={styles.label}>활성화 함수 그래프 ({activation.toUpperCase()})</h3>
            <canvas
                ref={canvasRef}
                style={styles.canvas}
            />
            <div style={styles.graphLegend}>
                <span style={{ color: '#60a5fa' }}>--- {activation}(z) 곡선</span>
                <span style={{ color: '#f87171' }}>● 현재 값 (z={z.toFixed(2)}, y={y.toFixed(4)})</span>
            </div>
        </div>
    );
}

/* ── Main Component ── */
export default function NeuronLab() {

    // Inputs (x)
    const [inputs, setInputs] = useState({ x1: 0.5, x2: -0.2 });

    // Weights (w) & Bias (b)
    const [weights, setWeights] = useState({ w1: 1.0, w2: -1.0 });
    const [bias, setBias] = useState(0.0);

    // Activation Function
    const [activation, setActivation] = useState('sigmoid'); // sigmoid, relu, tanh, step
    const [showDeepDive, setShowDeepDive] = useState(false);

    // Calculation
    const z = useMemo(() => {
        return (inputs.x1 * weights.w1) + (inputs.x2 * weights.w2) + bias;
    }, [inputs, weights, bias]);

    const y = useMemo(() => {
        switch (activation) {
            case 'sigmoid': return 1 / (1 + Math.exp(-z));
            case 'relu': return Math.max(0, z);
            case 'tanh': return Math.tanh(z);
            case 'step': return z >= 0 ? 1 : 0;
            default: return 0;
        }
    }, [z, activation]);

    // Helpers for styles
    const getStrokeWidth = (w) => Math.max(1, Math.abs(w) * 3);
    const getStrokeColor = (w) => w > 0 ? '#60a5fa' : w < 0 ? '#f87171' : '#94a3b8';

    return (
        <div style={styles.container}>
            <Breadcrumb
                items={[{ label: '6주차 인트로', href: '/week6/intro' }]}
                current="인공 뉴런 연구실"
            />
            <div style={styles.header}>
                <div style={styles.headerTitle}>
                    <span style={{ fontSize: '1.5rem', marginRight: 8 }}>🧠</span>
                    <span style={{ fontWeight: 700 }}>인공 뉴런 연구실 (Neuron Lab)</span>
                </div>
            </div>

            <div style={styles.content}>
                {/* 1. Visualization (Left) */}
                <div style={styles.card}>
                    <h3 style={styles.label}>뉴런 시각화 (Neuron Visualization)</h3>
                    <div style={styles.diagramContainer}>
                        <svg width="100%" height="400" viewBox="0 0 600 400" style={{ overflow: 'visible' }}>
                            {/* Synapses (Lines) */}
                            {/* x1 to Neuron */}
                            <line x1="100" y1="100" x2="350" y2="200"
                                stroke={getStrokeColor(weights.w1)}
                                strokeWidth={getStrokeWidth(weights.w1)}
                                strokeLinecap="round"
                            />
                            {/* x2 to Neuron */}
                            <line x1="100" y1="300" x2="350" y2="200"
                                stroke={getStrokeColor(weights.w2)}
                                strokeWidth={getStrokeWidth(weights.w2)}
                                strokeLinecap="round"
                            />

                            {/* Input Nodes */}
                            {/* x1 */}
                            <g transform="translate(100, 100)">
                                <circle r="30" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2" />
                                <text x="0" y="-8" textAnchor="middle" fill="#94a3b8" fontSize="11">Input x₁</text>
                                <text x="0" y="8" textAnchor="middle" fill="#fff" fontWeight="bold" fontSize="12">
                                    {inputs.x1.toFixed(1)}
                                </text>
                                <text x="100" y="30" textAnchor="middle" fill={getStrokeColor(weights.w1)} fontSize="11" fontWeight="bold">
                                    w₁={weights.w1.toFixed(1)}
                                </text>
                            </g>

                            {/* x2 */}
                            <g transform="translate(100, 300)">
                                <circle r="30" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2" />
                                <text x="0" y="-8" textAnchor="middle" fill="#94a3b8" fontSize="11">Input x₂</text>
                                <text x="0" y="8" textAnchor="middle" fill="#fff" fontWeight="bold" fontSize="12">
                                    {inputs.x2.toFixed(1)}
                                </text>
                                <text x="100" y="-20" textAnchor="middle" fill={getStrokeColor(weights.w2)} fontSize="11" fontWeight="bold">
                                    w₂={weights.w2.toFixed(1)}
                                </text>
                            </g>

                            {/* Neuron Node (Summation + Bias) */}
                            <g transform="translate(350, 200)">
                                <circle r="50" fill="#0f172a" stroke="#60a5fa" strokeWidth="4" />
                                <text x="0" y="-15" textAnchor="middle" fill="#94a3b8" fontSize="11">Neuron</text>
                                <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="14">∑</text>
                                <text x="0" y="25" textAnchor="middle" fill="#60a5fa" fontSize="11">b={bias.toFixed(1)}</text>
                            </g>

                            {/* Output Connection */}
                            <line x1="400" y1="200" x2="500" y2="200" stroke="#fff" strokeWidth="4" />

                            {/* Output Node (Activation) */}
                            <g transform="translate(530, 200)">
                                <rect x="-40" y="-30" width="80" height="60" rx="10" fill={y > 0.5 ? '#22c55e' : '#334155'} />
                                <text x="0" y="-45" textAnchor="middle" fill="#94a3b8" fontSize="12">Output y</text>
                                <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">
                                    {y.toFixed(3)}
                                </text>
                                <text x="0" y="45" textAnchor="middle" fill="#94a3b8" fontSize="12">
                                    {activation.toUpperCase()}
                                </text>
                            </g>
                        </svg>

                        <div style={styles.formulaBox}>
                            <p>
                                <span style={{ color: '#94a3b8' }}>z</span> =
                                (<span style={{ color: '#fff' }}>{inputs.x1}</span> × <span style={{ color: getStrokeColor(weights.w1) }}>{weights.w1}</span>) +
                                (<span style={{ color: '#fff' }}>{inputs.x2}</span> × <span style={{ color: getStrokeColor(weights.w2) }}>{weights.w2}</span>) +
                                <span style={{ color: '#60a5fa' }}> {bias} </span>
                                = <strong>{z.toFixed(2)}</strong>
                            </p>
                            <p style={{ marginTop: 5 }}>
                                <span style={{ color: '#22c55e' }}>y</span> = {activation}({z.toFixed(2)}) = <strong>{y.toFixed(4)}</strong>
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Activation Graph (Canvas) */}
                <div style={styles.card}>
                    <ActivationGraph activation={activation} z={z} y={y} />
                </div>

                {/* 3. Controls */}
                <div style={styles.controlsGrid}>
                    {/* Inputs */}
                    <div style={styles.card}>
                        <h3 style={styles.label}>1. 입력값 (Inputs)</h3>
                        <ControlRow label="x₁" value={inputs.x1} min={-1} max={1} step={0.1} color="#fff"
                            onChange={v => setInputs({ ...inputs, x1: v })} />
                        <ControlRow label="x₂" value={inputs.x2} min={-1} max={1} step={0.1} color="#fff"
                            onChange={v => setInputs({ ...inputs, x2: v })} />
                    </div>

                    {/* Weights */}
                    <div style={styles.card}>
                        <h3 style={styles.label}>2. 가중치 (Weights)</h3>
                        <ControlRow label="w₁" value={weights.w1} min={-3} max={3} step={0.1} color={getStrokeColor(weights.w1)}
                            onChange={v => setWeights({ ...weights, w1: v })} />
                        <ControlRow label="w₂" value={weights.w2} min={-3} max={3} step={0.1} color={getStrokeColor(weights.w2)}
                            onChange={v => setWeights({ ...weights, w2: v })} />
                    </div>

                    {/* Bias & Activation */}
                    <div style={styles.card}>
                        <h3 style={styles.label}>3. 편향 및 활성화 함수</h3>
                        <ControlRow label="Bias (b)" value={bias} min={-3} max={3} step={0.1} color="#60a5fa"
                            onChange={v => setBias(v)} />

                        <div style={{ marginTop: 20 }}>
                            <label style={{ ...styles.label, display: 'block' }}>활성화 함수 (Activation)</label>
                            <div style={styles.btnGroup}>
                                {['sigmoid', 'relu', 'tanh', 'step'].map(fn => (
                                    <button
                                        key={fn}
                                        style={{
                                            ...styles.actBtn,
                                            background: activation === fn ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                                            color: activation === fn ? '#000' : '#fff'
                                        }}
                                        onClick={() => setActivation(fn)}
                                    >
                                        {fn}
                                    </button>
                                ))}
                            </div>
                            <p style={styles.explain}>
                                {activation === 'sigmoid' && 'Sigmoid: 0과 1 사이의 값으로 압축합니다. 확률 표현에 적합합니다.'}
                                {activation === 'relu' && 'ReLU: 0보다 작으면 0, 크면 그대로 출력합니다. 심층 신경망에서 가장 많이 쓰입니다.'}
                                {activation === 'tanh' && 'Tanh: -1과 1 사이의 값으로 압축합니다.'}
                                {activation === 'step' && 'Step: 0보다 크면 1, 작으면 0입니다. (Perceptron)'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. Theory Section */}
                <div style={styles.card}>
                    <h3 style={styles.label}>🤖 이것이 모이면 지능이 됩니다</h3>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                        <p style={{ marginBottom: 10 }}>
                            <strong>1. 수천억 개의 뉴런 (Parameters)</strong><br />
                            여러분이 지금 만든 이 단순한 뉴런 하나가
                            GPT-4 같은 모델에는 <strong>수천억 개</strong>나 들어있습니다.
                            단순한 덧셈/곱셈도 엄청나게 많이 모이면 &quot;추론&quot;을 할 수 있게 됩니다! 🧠
                        </p>
                        <p style={{ marginBottom: 10 }}>
                            <strong>2. 비선형성의 마법 (ReLU)</strong><br />
                            단순히 더하기만 하면 아무리 층을 쌓아도 선형(Linear) 모델에 불과합니다.
                            중간에 <strong>ReLU</strong> 같은 비선형 함수를 섞어줘야 복잡한 문제를 풀 수 있습니다.
                        </p>
                    </div>
                </div>

                {/* 5. Why Non-linear? XOR Problem */}
                <div style={styles.card}>
                    <h3 style={styles.label}>❓ 왜 비선형 활성화 함수가 필요한가?</h3>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.7 }}>
                        <p style={{ marginBottom: 12 }}>
                            <strong style={{ color: '#f87171' }}>문제: XOR은 선형으로 풀 수 없습니다</strong>
                        </p>
                        <div style={styles.xorTable}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>x₁</th>
                                        <th style={styles.th}>x₂</th>
                                        <th style={styles.th}>AND</th>
                                        <th style={styles.th}>OR</th>
                                        <th style={{ ...styles.th, color: '#f87171' }}>XOR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td style={styles.td}>0</td><td style={styles.td}>0</td><td style={styles.td}>0</td><td style={styles.td}>0</td><td style={{ ...styles.td, color: '#f87171' }}>0</td></tr>
                                    <tr><td style={styles.td}>0</td><td style={styles.td}>1</td><td style={styles.td}>0</td><td style={styles.td}>1</td><td style={{ ...styles.td, color: '#f87171' }}>1</td></tr>
                                    <tr><td style={styles.td}>1</td><td style={styles.td}>0</td><td style={styles.td}>0</td><td style={styles.td}>1</td><td style={{ ...styles.td, color: '#f87171' }}>1</td></tr>
                                    <tr><td style={styles.td}>1</td><td style={styles.td}>1</td><td style={styles.td}>1</td><td style={styles.td}>1</td><td style={{ ...styles.td, color: '#f87171' }}>0</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <p style={{ marginBottom: 10, marginTop: 12 }}>
                            AND와 OR는 직선 하나로 0과 1을 나눌 수 있습니다.
                            하지만 <strong style={{ color: '#f87171' }}>XOR</strong>은 직선 하나로는 절대 분리할 수 없습니다!
                        </p>
                        <div style={styles.xorVisual}>
                            <svg width="160" height="160" viewBox="0 0 160 160">
                                {/* grid background */}
                                <rect width="160" height="160" fill="rgba(0,0,0,0.3)" rx="8" />
                                {/* axes */}
                                <line x1="30" y1="130" x2="150" y2="130" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <line x1="30" y1="130" x2="30" y2="10" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <text x="145" y="145" fill="#94a3b8" fontSize="10">x₁</text>
                                <text x="10" y="15" fill="#94a3b8" fontSize="10">x₂</text>
                                {/* (0,0)=0 */}
                                <circle cx="50" cy="110" r="8" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                                <text x="50" y="114" textAnchor="middle" fill="#94a3b8" fontSize="9">0</text>
                                {/* (1,0)=1 */}
                                <circle cx="120" cy="110" r="8" fill="#22c55e" stroke="#22c55e" strokeWidth="1.5" />
                                <text x="120" y="114" textAnchor="middle" fill="#fff" fontSize="9">1</text>
                                {/* (0,1)=1 */}
                                <circle cx="50" cy="40" r="8" fill="#22c55e" stroke="#22c55e" strokeWidth="1.5" />
                                <text x="50" y="44" textAnchor="middle" fill="#fff" fontSize="9">1</text>
                                {/* (1,1)=0 */}
                                <circle cx="120" cy="40" r="8" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                                <text x="120" y="44" textAnchor="middle" fill="#94a3b8" fontSize="9">0</text>
                                {/* impossible line */}
                                <line x1="20" y1="75" x2="150" y2="75" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4,4" />
                                <text x="85" y="155" textAnchor="middle" fill="#f87171" fontSize="9">직선 하나로는 불가!</text>
                            </svg>
                        </div>
                        <p style={{ marginBottom: 10 }}>
                            <strong style={{ color: '#60a5fa' }}>해결: 비선형 활성화 + 은닉층(Hidden Layer)</strong><br />
                            비선형 활성화 함수를 가진 뉴런을 여러 층으로 쌓으면,
                            공간을 &quot;구부려서&quot; XOR도 분류할 수 있게 됩니다.
                        </p>
                        <div style={styles.keyInsight}>
                            선형 함수를 아무리 합성해도 결과는 선형입니다: f(g(x)) = ax + b.<br />
                            비선형 함수가 있어야 곡선, 영역 분할 등 복잡한 패턴을 학습할 수 있습니다.
                        </div>
                    </div>
                </div>

                {/* 6. Biological vs Artificial Neuron */}
                <div style={styles.card}>
                    <h3 style={styles.label}>🔬 생물학적 뉴런 vs 인공 뉴런</h3>
                    <div style={styles.comparisonGrid}>
                        {/* Biological Neuron */}
                        <div style={styles.comparisonCard}>
                            <div style={styles.comparisonHeader}>
                                <span style={{ fontSize: '1.3rem' }}>🧬</span>
                                <strong style={{ color: '#22c55e' }}>생물학적 뉴런</strong>
                            </div>
                            <div style={styles.comparisonBody}>
                                <div style={styles.comparisonRow}>
                                    <span style={styles.comparisonLabel}>입력</span>
                                    <span style={styles.comparisonValue}>수상돌기 (Dendrites)</span>
                                </div>
                                <div style={styles.comparisonRow}>
                                    <span style={styles.comparisonLabel}>가중치</span>
                                    <span style={styles.comparisonValue}>시냅스 강도 (Synapse Strength)</span>
                                </div>
                                <div style={styles.comparisonRow}>
                                    <span style={styles.comparisonLabel}>합산</span>
                                    <span style={styles.comparisonValue}>세포체 (Cell Body / Soma)</span>
                                </div>
                                <div style={styles.comparisonRow}>
                                    <span style={styles.comparisonLabel}>활성화</span>
                                    <span style={styles.comparisonValue}>역치 전위 (Threshold Potential)</span>
                                </div>
                                <div style={styles.comparisonRow}>
                                    <span style={styles.comparisonLabel}>출력</span>
                                    <span style={styles.comparisonValue}>축삭돌기 (Axon)</span>
                                </div>
                                <div style={styles.comparisonRow}>
                                    <span style={styles.comparisonLabel}>신호</span>
                                    <span style={styles.comparisonValue}>전기 화학적 신호</span>
                                </div>
                            </div>
                        </div>

                        {/* Artificial Neuron */}
                        <div style={styles.comparisonCard}>
                            <div style={styles.comparisonHeader}>
                                <span style={{ fontSize: '1.3rem' }}>🤖</span>
                                <strong style={{ color: '#60a5fa' }}>인공 뉴런</strong>
                            </div>
                            <div style={styles.comparisonBody}>
                                <div style={styles.comparisonRow}>
                                    <span style={styles.comparisonLabel}>입력</span>
                                    <span style={styles.comparisonValue}>입력값 x₁, x₂, ... (숫자)</span>
                                </div>
                                <div style={styles.comparisonRow}>
                                    <span style={styles.comparisonLabel}>가중치</span>
                                    <span style={styles.comparisonValue}>가중치 w₁, w₂, ... (학습)</span>
                                </div>
                                <div style={styles.comparisonRow}>
                                    <span style={styles.comparisonLabel}>합산</span>
                                    <span style={styles.comparisonValue}>가중합 z = &Sigma;(x&middot;w) + b</span>
                                </div>
                                <div style={styles.comparisonRow}>
                                    <span style={styles.comparisonLabel}>활성화</span>
                                    <span style={styles.comparisonValue}>활성화 함수 (Sigmoid, ReLU...)</span>
                                </div>
                                <div style={styles.comparisonRow}>
                                    <span style={styles.comparisonLabel}>출력</span>
                                    <span style={styles.comparisonValue}>출력값 y (다음 층으로 전달)</span>
                                </div>
                                <div style={styles.comparisonRow}>
                                    <span style={styles.comparisonLabel}>신호</span>
                                    <span style={styles.comparisonValue}>부동소수점 숫자 (float)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={styles.comparisonNote}>
                        <p>
                            <strong>핵심 차이:</strong> 생물학적 뉴런은 &quot;발화(fire)&quot;하거나 안 하거나의 이진 방식에 가깝지만,
                            인공 뉴런은 <strong>연속적인 숫자</strong>를 출력합니다.
                            인공 뉴런의 Step 함수가 생물학적 뉴런의 역치 발화와 가장 유사합니다.
                        </p>
                        <p style={{ marginTop: 8 }}>
                            <strong>공통점:</strong> 둘 다 여러 입력을 받아 하나의 출력을 만들며,
                            <strong> 연결 강도(가중치)</strong>를 조절하여 학습합니다.
                        </p>
                    </div>
                </div>

                {/* 한 걸음 더: XOR과 비선형성 */}
                <div style={{
                    borderRadius: 12,
                    border: '1px solid rgba(124, 92, 252, 0.2)',
                    overflow: 'hidden',
                    marginTop: 20,
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
                        {showDeepDive ? '▼' : '▶'} 한 걸음 더: 뉴런 하나로 풀 수 없는 문제 (XOR)
                    </button>
                    {showDeepDive && (
                        <div style={{
                            padding: 16, background: 'rgba(124, 92, 252, 0.04)',
                            fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7,
                            textAlign: 'left',
                        }}>
                            <p style={{ marginBottom: 8 }}>
                                <strong style={{ color: '#fbbf24' }}>XOR 문제</strong> —
                                입력이 (0,1) 또는 (1,0)이면 1, (0,0)이나 (1,1)이면 0을 출력해야 해요.
                                이건 하나의 직선으로는 절대 나눌 수 없습니다!
                            </p>
                            <p style={{ marginBottom: 8 }}>
                                <strong style={{ color: '#34d399' }}>해결책: 층을 쌓기</strong> —
                                뉴런 하나로는 불가능하지만, 뉴런을 여러 층으로 쌓으면(다층 퍼셉트론) 곡선 경계를 만들어 XOR을 풀 수 있어요.
                                이것이 바로 &quot;딥러닝&quot;의 시작점입니다!
                            </p>
                            <p>
                                <strong style={{ color: '#f87171' }}>핵심 포인트</strong> —
                                활성화 함수가 없으면 층을 아무리 쌓아도 직선밖에 못 그려요.
                                비선형 활성화 함수 + 다층 구조 = 어떤 복잡한 패턴도 학습 가능!
                                다음 주차(7주차)에서 역전파로 이 다층 신경망을 학습시키는 법을 배웁니다.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ControlRow({ label, value, min, max, step, color, onChange }) {
    return (
        <div style={{ marginBottom: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: color, fontWeight: 'bold' }}>{label}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{value.toFixed(1)}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: color }}
            />
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        padding: '20px',
        maxWidth: 1000,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    backBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--text-dim)',
        cursor: 'pointer',
        fontSize: '0.9rem',
        marginRight: 20,
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '1.2rem',
        color: '#fff',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    card: {
        background: 'rgba(15, 10, 40, 0.6)',
        borderRadius: 16,
        padding: 24,
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    label: {
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        marginBottom: 16,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    diagramContainer: {
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 10,
        border: '1px solid rgba(255,255,255,0.05)',
        textAlign: 'center',
    },
    controlsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
    },
    formulaBox: {
        marginTop: 10,
        padding: 15,
        background: 'rgba(0,0,0,0.5)',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: '1.1rem',
        textAlign: 'center',
        lineHeight: 1.6,
        border: '1px solid rgba(255,255,255,0.05)',
    },
    btnGroup: {
        display: 'flex',
        gap: 8,
        marginBottom: 10,
    },
    actBtn: {
        flex: 1,
        padding: '8px',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.9rem',
        transition: 'all 0.2s',
    },
    explain: {
        fontSize: '0.85rem',
        color: '#94a3b8',
        lineHeight: 1.5,
        background: 'rgba(255,255,255,0.05)',
        padding: 10,
        borderRadius: 6,
    },
    /* ── Activation Graph ── */
    graphContainer: {
        textAlign: 'center',
    },
    canvas: {
        width: '100%',
        height: 260,
        background: 'rgba(0,0,0,0.35)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'block',
    },
    graphLegend: {
        display: 'flex',
        justifyContent: 'center',
        gap: 24,
        marginTop: 10,
        fontSize: '0.8rem',
    },
    /* ── XOR Section ── */
    xorTable: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 6,
    },
    table: {
        borderCollapse: 'collapse',
        fontSize: '0.85rem',
    },
    th: {
        padding: '6px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        color: '#94a3b8',
        fontWeight: 600,
        textAlign: 'center',
    },
    td: {
        padding: '5px 14px',
        textAlign: 'center',
        color: '#e2e8f0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    xorVisual: {
        display: 'flex',
        justifyContent: 'center',
        margin: '10px 0',
    },
    keyInsight: {
        marginTop: 10,
        padding: '12px 16px',
        background: 'rgba(96,165,250,0.1)',
        border: '1px solid rgba(96,165,250,0.25)',
        borderRadius: 8,
        fontSize: '0.85rem',
        color: '#93c5fd',
        lineHeight: 1.6,
    },
    /* ── Comparison Section ── */
    comparisonGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
        marginBottom: 16,
    },
    comparisonCard: {
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 16,
        border: '1px solid rgba(255,255,255,0.08)',
    },
    comparisonHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
        paddingBottom: 10,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        fontSize: '0.95rem',
    },
    comparisonBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    comparisonRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.82rem',
    },
    comparisonLabel: {
        color: '#94a3b8',
        fontWeight: 600,
        minWidth: 50,
    },
    comparisonValue: {
        color: '#e2e8f0',
        textAlign: 'right',
    },
    comparisonNote: {
        fontSize: '0.83rem',
        color: '#94a3b8',
        lineHeight: 1.6,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 8,
        padding: '12px 16px',
        border: '1px solid rgba(255,255,255,0.06)',
    },
};
