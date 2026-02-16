'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/layout/Breadcrumb';

// ── 정규화 함수들 ──
function batchNorm(data) {
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length;
    return data.map(v => (v - mean) / (Math.sqrt(variance) + 1e-6));
}

function layerNorm(data) {
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length;
    return data.map(v => (v - mean) / (Math.sqrt(variance) + 1e-6));
}

function rmsNorm(data) {
    const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length) + 1e-6;
    return data.map(v => v / rms);
}

// ── 훈련 시뮬레이션 (간소화) ──
function simulateTraining(withNorm) {
    const steps = 30;
    const losses = [];
    let loss = 3.0;
    for (let i = 0; i < steps; i++) {
        if (withNorm) {
            loss *= (0.88 + Math.random() * 0.06);
            if (loss < 0.1) loss = 0.08 + Math.random() * 0.05;
        } else {
            if (i < 10) {
                loss *= (0.9 + Math.random() * 0.15);
            } else if (i < 18) {
                loss *= (0.95 + Math.random() * 0.2);
            } else {
                loss *= (1.0 + Math.random() * 0.3);
                if (loss > 10) loss = 8 + Math.random() * 5;
            }
        }
        losses.push(Math.min(loss, 15));
    }
    return losses;
}

// ── Norm 비교 데이터 ──
const NORM_COMPARISON = [
    {
        name: 'Batch Norm',
        formula: 'BN(x) = (x − μ_B) / √(σ²_B + ε)',
        desc: '미니배치(mini-batch: 전체 데이터를 한 번에 처리하면 메모리가 부족하므로, 작은 묶음으로 나눠서 학습) 내의 같은 채널(channel: 데이터의 각 특성. 이미지에서는 RGB 색상, NLP에서는 임베딩의 각 차원) 값들로 평균/분산 계산',
        pros: 'CNN에서 매우 효과적, 정규화 효과',
        cons: '배치 크기 의존, 추론 시 별도 통계 필요',
        usedIn: 'ResNet, VGG 등 CNN',
        color: '#3b82f6',
    },
    {
        name: 'Layer Norm',
        formula: 'LN(x) = (x − μ_L) / √(σ²_L + ε)',
        desc: '하나의 샘플 내 모든 은닉값으로 평균/분산 계산',
        pros: '배치 크기 무관, 시퀀스 모델에 적합',
        cons: 'RMSNorm보다 약간 느림 (평균 계산 추가)',
        usedIn: 'GPT-2, GPT-3, BERT',
        color: '#8b5cf6',
    },
    {
        name: 'RMS Norm',
        formula: 'RMSNorm(x) = x / √(mean(x²) + ε)',
        desc: '평균을 빼지 않고, RMS(제곱평균제곱근)로만 나눔',
        pros: 'LayerNorm보다 빠름 (평균 계산 생략), 성능 동등',
        cons: '비교적 최신 기법, 일부 모델에서 불안정',
        usedIn: 'LLaMA, Gemma, Mistral',
        color: '#f59e0b',
    },
];

// ── 레이어 폭발/소실 시뮬레이션 ──
function simulateLayers(numLayers, withNorm) {
    const result = [];
    let value = 1.0;
    for (let i = 0; i < numLayers; i++) {
        const weight = 1.1 + Math.sin(i * 0.5) * 0.3;
        value *= weight;
        if (withNorm) {
            const rms = Math.abs(value) + 1e-6;
            value = value / rms;
        }
        result.push({ layer: i + 1, value: Math.min(Math.abs(value), 100) });
    }
    return result;
}

export default function Week12Page() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('rms');
    const [scale, setScale] = useState(1.0);
    const [data] = useState(() => Array.from({ length: 50 }, () => (Math.random() - 0.5) * 2));

    // 훈련 시뮬레이션
    const [isTraining, setIsTraining] = useState(false);
    const [trainStep, setTrainStep] = useState(0);
    const [lossWithNorm] = useState(() => simulateTraining(true));
    const [lossWithoutNorm] = useState(() => simulateTraining(false));

    // 레이어 폭발/소실
    const [numLayers, setNumLayers] = useState(10);

    // Norm 비교 선택
    const [selectedNorm, setSelectedNorm] = useState('rms');

    // ── 한 걸음 더 (Deep Dive) ──
    const [showDeepDive, setShowDeepDive] = useState(false);
    const [normInput] = useState(() => [2.5, -1.2, 0.8, 3.1, -0.5, 1.7, -2.8, 0.3]);

    // ── RMS 기본 계산 ──
    const scaledData = data.map(d => d * scale);
    const rms = Math.sqrt(scaledData.reduce((s, v) => s + v * v, 0) / scaledData.length) + 1e-6;
    const normalizedData = scaledData.map(d => d / rms);

    // ── Norm 비교 결과 ──
    const normResults = {
        batch: batchNorm(normInput),
        layer: layerNorm(normInput),
        rms: rmsNorm(normInput),
    };

    // ── 레이어 통과 시뮬레이션 ──
    const layersWithNorm = simulateLayers(numLayers, true);
    const layersWithoutNorm = simulateLayers(numLayers, false);

    // ── 훈련 애니메이션 ──
    useEffect(() => {
        if (!isTraining) return;
        if (trainStep >= 29) { setIsTraining(false); return; }
        const timer = setTimeout(() => setTrainStep(s => s + 1), 200);
        return () => clearTimeout(timer);
    }, [isTraining, trainStep]);

    const startTraining = useCallback(() => {
        setTrainStep(0);
        setIsTraining(true);
    }, []);

    const tabs = [
        { id: 'rms', label: 'RMS 정규화' },
        { id: 'compare', label: 'Norm 비교' },
        { id: 'training', label: '훈련 시뮬레이션' },
        { id: 'explosion', label: '값 폭발/소실' },
    ];

    return (
        <div style={styles.container}>
            <Breadcrumb
                items={[{ label: '12주차 인트로', href: '/week12/intro' }]}
                current="정규화 실험실"
            />
            <div style={styles.header}>
                <h1 style={styles.title}>⚡ 12주차: 정규화 (Normalization)</h1>
            </div>

            {/* ── 탭 네비게이션 ── */}
            <div style={styles.tabBar}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            ...styles.tabBtn,
                            ...(activeTab === tab.id ? styles.tabBtnActive : {}),
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={styles.content}>

                {/* ═══ 탭 1: RMS 정규화 기본 ═══ */}
                {activeTab === 'rms' && (
                    <>
                        <div style={styles.controlPanel}>
                            <h2 style={styles.panelTitle}>🎚️ 입력 데이터 크기 조절</h2>
                            <p style={styles.desc}>
                                슬라이더를 올려 입력값의 <strong>분산(Variance)</strong>을 키워보세요!
                                값이 커져도 정규화 후에는 항상 일정한 범위로 돌아옵니다.
                            </p>
                            <div style={styles.sliderRow}>
                                <span style={styles.sliderLabel}>입력 배율: x{scale.toFixed(1)}</span>
                                <input
                                    type="range" min="0.1" max="10" step="0.1"
                                    value={scale} onChange={e => setScale(parseFloat(e.target.value))}
                                    className="slider-cosmic"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            {scale > 5 && (
                                <div style={styles.warningBox}>
                                    ⚠️ 입력값이 매우 큽니다! 정규화 없이는 학습이 불안정해질 수 있는 수준입니다.
                                </div>
                            )}
                        </div>

                        <div style={styles.vizRow}>
                            <div style={styles.vizCard}>
                                <h3 style={{ color: '#f43f5e' }}>🔴 정규화 전 (Raw)</h3>
                                <div style={styles.scatterBox}>
                                    {scaledData.map((val, i) => (
                                        <div key={i} style={{
                                            ...styles.dot,
                                            left: `${(i / 50) * 100}%`,
                                            top: '50%',
                                            transform: `translate(-50%, calc(-50% + ${-val * (scale > 3 ? 10 : 20)}px))`,
                                            background: '#f43f5e',
                                            opacity: 0.6
                                        }} />
                                    ))}
                                    <div style={styles.axis} />
                                </div>
                                <p style={styles.statLabel}>
                                    범위: {Math.min(...scaledData).toFixed(1)} ~ {Math.max(...scaledData).toFixed(1)}
                                </p>
                            </div>

                            <div style={styles.arrowContainer}>
                                <span style={{ fontSize: '2rem' }}>➡️</span>
                                <div style={styles.rmsValue}>RMS: {rms.toFixed(2)}</div>
                                <div style={styles.opBadge}>÷ RMS</div>
                            </div>

                            <div style={styles.vizCard}>
                                <h3 style={{ color: '#10b981' }}>🟢 정규화 후 (RMSNorm)</h3>
                                <div style={styles.scatterBox}>
                                    {normalizedData.map((val, i) => (
                                        <div key={i} style={{
                                            ...styles.dot,
                                            left: `${(i / 50) * 100}%`,
                                            top: '50%',
                                            transform: `translate(-50%, calc(-50% + ${-val * 20}px))`,
                                            background: '#10b981',
                                            opacity: 0.8
                                        }} />
                                    ))}
                                    <div style={styles.axis} />
                                </div>
                                <p style={styles.statLabel}>안정 범위: ≈ -1.0 ~ 1.0</p>
                            </div>
                        </div>

                        <div style={styles.formulaBox}>
                            <div style={styles.formulaTitle}>📐 RMSNorm 공식</div>
                            <div style={styles.formula}>
                                RMSNorm(x) = x / √( (1/n) Σ xᵢ² + ε )
                            </div>
                            <p style={styles.formulaDesc}>
                                평균을 빼지 않고, 제곱 평균의 제곱근(RMS)으로만 나누어 정규화합니다.
                                LayerNorm보다 연산이 적어 LLaMA, Mistral 등 최신 LLM에서 사용합니다.
                            </p>
                            <div style={{
                                marginTop: 10,
                                padding: '8px 14px',
                                borderRadius: 8,
                                background: 'rgba(124, 92, 252, 0.08)',
                                border: '1px solid rgba(124, 92, 252, 0.2)',
                                fontSize: '0.83rem',
                                color: '#c4b5fd',
                                lineHeight: 1.6,
                            }}>
                                <strong style={{ color: '#a78bfa' }}>ε(엡실론)</strong> = 아주 작은 수(예: 0.00001). 분모가 0이 되는 것을 막기 위한 안전장치입니다.
                            </div>
                        </div>
                    </>
                )}

                {/* ═══ 탭 2: Norm 종류 비교 ═══ */}
                {activeTab === 'compare' && (
                    <>
                        <div style={styles.theoryCard}>
                            <h3 style={styles.theoryTitle}>📊 정규화 기법 비교</h3>
                            <p style={styles.desc}>
                                같은 입력 데이터에 3가지 정규화를 적용한 결과를 비교해보세요.
                                아래 버튼으로 각 방식을 선택하면 계산 과정과 결과가 표시됩니다.
                            </p>
                        </div>

                        {/* Norm 선택 버튼 */}
                        <div style={styles.normBtnRow}>
                            {NORM_COMPARISON.map(n => (
                                <button
                                    key={n.name}
                                    onClick={() => setSelectedNorm(n.name === 'Batch Norm' ? 'batch' : n.name === 'Layer Norm' ? 'layer' : 'rms')}
                                    style={{
                                        ...styles.normBtn,
                                        border: `2px solid ${n.color}`,
                                        background: (selectedNorm === 'batch' && n.name === 'Batch Norm') ||
                                            (selectedNorm === 'layer' && n.name === 'Layer Norm') ||
                                            (selectedNorm === 'rms' && n.name === 'RMS Norm')
                                            ? n.color + '30' : 'transparent',
                                        color: n.color,
                                    }}
                                >
                                    {n.name}
                                </button>
                            ))}
                        </div>

                        {/* 입력 데이터 */}
                        <div style={styles.dataPanel}>
                            <div style={styles.dataPanelTitle}>입력 벡터 x = </div>
                            <div style={styles.dataValues}>
                                {normInput.map((v, i) => (
                                    <span key={i} style={styles.dataChip}>{v.toFixed(1)}</span>
                                ))}
                            </div>
                        </div>

                        {/* 출력 비교 바 차트 */}
                        <div style={styles.barChartPanel}>
                            <h3 style={{ color: '#fff', marginBottom: 12 }}>
                                {selectedNorm === 'batch' ? 'Batch Norm' : selectedNorm === 'layer' ? 'Layer Norm' : 'RMS Norm'} 결과
                            </h3>
                            <div style={styles.barChart}>
                                {normResults[selectedNorm].map((v, i) => {
                                    const barHeight = Math.abs(v) * 60;
                                    const isNeg = v < 0;
                                    const color = NORM_COMPARISON.find(n =>
                                        (selectedNorm === 'batch' && n.name === 'Batch Norm') ||
                                        (selectedNorm === 'layer' && n.name === 'Layer Norm') ||
                                        (selectedNorm === 'rms' && n.name === 'RMS Norm')
                                    )?.color || '#fff';
                                    return (
                                        <div key={i} style={styles.barCol}>
                                            <div style={{
                                                ...styles.barTop,
                                                height: isNeg ? 0 : barHeight,
                                                background: color,
                                            }} />
                                            <div style={styles.barZeroLine} />
                                            <div style={{
                                                ...styles.barBottom,
                                                height: isNeg ? barHeight : 0,
                                                background: color,
                                                opacity: 0.6,
                                            }} />
                                            <span style={styles.barLabel}>{v.toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 비교 테이블 */}
                        <div style={styles.compTable}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>특징</th>
                                        {NORM_COMPARISON.map(n => (
                                            <th key={n.name} style={{ ...styles.th, color: n.color }}>{n.name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={styles.td}>공식</td>
                                        {NORM_COMPARISON.map(n => (
                                            <td key={n.name} style={{ ...styles.td, fontFamily: 'monospace', fontSize: '0.75rem' }}>{n.formula}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={styles.td}>계산 방식</td>
                                        {NORM_COMPARISON.map(n => (
                                            <td key={n.name} style={styles.td}>{n.desc}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={styles.td}>장점</td>
                                        {NORM_COMPARISON.map(n => (
                                            <td key={n.name} style={{ ...styles.td, color: '#4ade80' }}>{n.pros}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={styles.td}>단점</td>
                                        {NORM_COMPARISON.map(n => (
                                            <td key={n.name} style={{ ...styles.td, color: '#f87171' }}>{n.cons}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={styles.td}>사용 모델</td>
                                        {NORM_COMPARISON.map(n => (
                                            <td key={n.name} style={{ ...styles.td, fontWeight: 600 }}>{n.usedIn}</td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style={styles.infoBox}>
                            💡 <strong>핵심 차이:</strong> BatchNorm은 <em>배치 간 통계</em>, LayerNorm은 <em>샘플 내 통계</em>,
                            RMSNorm은 <em>평균 없이 RMS만</em> 사용합니다. Transformer 계열 모델은 LayerNorm/RMSNorm을 사용합니다.
                        </div>
                        <div style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            background: 'rgba(124, 92, 252, 0.08)',
                            border: '1px solid rgba(124, 92, 252, 0.2)',
                            fontSize: '0.83rem',
                            color: '#c4b5fd',
                            lineHeight: 1.6,
                        }}>
                            <strong style={{ color: '#a78bfa' }}>채널(channel)</strong> = 데이터의 각 특성(feature)을 의미합니다. 이미지에서는 RGB 색상, NLP에서는 임베딩의 각 차원이 채널입니다.
                        </div>
                    </>
                )}

                {/* ═══ 탭 3: 훈련 시뮬레이션 ═══ */}
                {activeTab === 'training' && (
                    <>
                        <div style={styles.theoryCard}>
                            <h3 style={styles.theoryTitle}>🏋️ 정규화 유무에 따른 훈련 비교</h3>
                            <p style={styles.desc}>
                                같은 모델을 정규화 <strong>있이</strong> vs <strong>없이</strong> 훈련시키면 어떤 차이가 날까요?
                                &quot;훈련 시작&quot; 버튼을 눌러 비교해보세요!
                            </p>
                        </div>

                        <button onClick={startTraining} style={styles.trainBtn}>
                            {isTraining ? '⏳ 훈련 중...' : '🚀 훈련 시작'}
                        </button>

                        <div style={styles.trainChartRow}>
                            {/* 정규화 있는 훈련 */}
                            <div style={styles.trainCard}>
                                <h3 style={{ color: '#10b981', marginBottom: 8 }}>✅ 정규화 적용</h3>
                                <div style={styles.lossChart}>
                                    {lossWithNorm.slice(0, trainStep + 1).map((loss, i) => {
                                        const h = Math.min((loss / 3.5) * 100, 100);
                                        return (
                                            <div key={i} style={styles.lossBarCol}>
                                                <div style={{
                                                    ...styles.lossBar,
                                                    height: `${h}%`,
                                                    background: loss < 0.5 ? '#10b981' : loss < 1.5 ? '#fbbf24' : '#f43f5e',
                                                }} />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={styles.trainStats}>
                                    <span>Step: {trainStep + 1}/30</span>
                                    <span style={{ color: '#10b981', fontWeight: 700 }}>
                                        Loss: {lossWithNorm[trainStep]?.toFixed(3) || '—'}
                                    </span>
                                </div>
                                <p style={styles.trainDesc}>
                                    Loss가 안정적으로 감소 → 학습 성공!
                                </p>
                            </div>

                            {/* 정규화 없는 훈련 */}
                            <div style={styles.trainCard}>
                                <h3 style={{ color: '#f43f5e', marginBottom: 8 }}>❌ 정규화 미적용</h3>
                                <div style={styles.lossChart}>
                                    {lossWithoutNorm.slice(0, trainStep + 1).map((loss, i) => {
                                        const h = Math.min((loss / 15) * 100, 100);
                                        return (
                                            <div key={i} style={styles.lossBarCol}>
                                                <div style={{
                                                    ...styles.lossBar,
                                                    height: `${h}%`,
                                                    background: loss > 5 ? '#f43f5e' : loss > 2 ? '#fbbf24' : '#10b981',
                                                }} />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={styles.trainStats}>
                                    <span>Step: {trainStep + 1}/30</span>
                                    <span style={{ color: '#f43f5e', fontWeight: 700 }}>
                                        Loss: {lossWithoutNorm[trainStep]?.toFixed(3) || '—'}
                                    </span>
                                </div>
                                <p style={styles.trainDesc}>
                                    초반에는 괜찮다가 후반에 Loss가 폭발! 💥
                                </p>
                            </div>
                        </div>

                        {trainStep >= 25 && (
                            <div style={styles.resultBox}>
                                <strong>📊 결과 분석:</strong> 정규화 없이는 약 20 스텝 이후 Loss가 급격히 상승합니다.
                                이는 깊은 신경망에서 중간 활성화 값의 크기가 제어되지 않아 그래디언트가 폭발하기 때문입니다.
                                정규화는 각 층의 출력을 일정한 범위로 유지하여 이 문제를 방지합니다.
                            </div>
                        )}
                    </>
                )}

                {/* ═══ 탭 4: 값 폭발/소실 ═══ */}
                {activeTab === 'explosion' && (
                    <>
                        <div style={styles.theoryCard}>
                            <h3 style={styles.theoryTitle}>💥 깊은 네트워크의 값 폭발/소실 문제</h3>
                            <div style={styles.theoryContent}>
                                <p>
                                    신경망에서 데이터가 여러 층을 통과할 때, 각 층의 가중치가 곱해집니다.
                                    가중치가 <strong>1보다 크면</strong> 값이 기하급수적으로 <strong style={{ color: '#f43f5e' }}>폭발(Exploding)</strong>하고,
                                    <strong>1보다 작으면</strong> 값이 <strong style={{ color: '#3b82f6' }}>소실(Vanishing)</strong>합니다.
                                </p>
                                <p>
                                    예: 가중치 1.1을 50번 곱하면 → 1.1⁵⁰ ≈ <strong>117</strong><br />
                                    가중치 0.9를 50번 곱하면 → 0.9⁵⁰ ≈ <strong>0.005</strong>
                                </p>
                            </div>
                        </div>

                        <div style={styles.controlPanel}>
                            <div style={styles.sliderRow}>
                                <span style={styles.sliderLabel}>신경망 깊이 (레이어 수): {numLayers}개</span>
                                <input
                                    type="range" min="3" max="50" step="1"
                                    value={numLayers} onChange={e => setNumLayers(parseInt(e.target.value))}
                                    className="slider-cosmic"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <div style={styles.trainChartRow}>
                            {/* 정규화 없음 */}
                            <div style={styles.trainCard}>
                                <h3 style={{ color: '#f43f5e', marginBottom: 8 }}>❌ 정규화 없음</h3>
                                <div style={styles.layerChart}>
                                    {layersWithoutNorm.map((d, i) => {
                                        const h = Math.min((d.value / Math.max(...layersWithoutNorm.map(x => x.value))) * 100, 100);
                                        return (
                                            <div key={i} style={styles.layerBarCol} title={`Layer ${d.layer}: ${d.value.toFixed(2)}`}>
                                                <div style={{
                                                    ...styles.layerBar,
                                                    height: `${h}%`,
                                                    background: d.value > 10 ? '#f43f5e' : d.value > 2 ? '#fbbf24' : '#3b82f6',
                                                }} />
                                                {i % Math.ceil(numLayers / 10) === 0 && (
                                                    <span style={styles.layerLabel}>L{d.layer}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <p style={styles.trainDesc}>
                                    {numLayers > 20
                                        ? '💥 값이 폭발하여 수치적으로 불안정합니다!'
                                        : '레이어가 깊어질수록 값이 점점 커집니다.'}
                                </p>
                            </div>

                            {/* 정규화 있음 */}
                            <div style={styles.trainCard}>
                                <h3 style={{ color: '#10b981', marginBottom: 8 }}>✅ RMSNorm 적용</h3>
                                <div style={styles.layerChart}>
                                    {layersWithNorm.map((d, i) => {
                                        const h = Math.min(d.value * 80, 100);
                                        return (
                                            <div key={i} style={styles.layerBarCol} title={`Layer ${d.layer}: ${d.value.toFixed(2)}`}>
                                                <div style={{
                                                    ...styles.layerBar,
                                                    height: `${h}%`,
                                                    background: '#10b981',
                                                }} />
                                                {i % Math.ceil(numLayers / 10) === 0 && (
                                                    <span style={styles.layerLabel}>L{d.layer}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <p style={styles.trainDesc}>
                                    정규화 덕분에 모든 레이어에서 값이 ≈1.0으로 안정적!
                                </p>
                            </div>
                        </div>

                        {/* 실제 모델 깊이 비교 */}
                        <div style={styles.modelCompare}>
                            <h3 style={{ color: '#fff', marginBottom: 12 }}>🏗️ 실제 LLM의 레이어 수</h3>
                            <div style={styles.modelRow}>
                                {[
                                    { name: 'GPT-2', layers: 12, color: '#3b82f6' },
                                    { name: 'GPT-3', layers: 96, color: '#8b5cf6' },
                                    { name: 'LLaMA-2 70B', layers: 80, color: '#f59e0b' },
                                    { name: 'GPT-4 (추정)', layers: 120, color: '#f43f5e' },
                                ].map(m => (
                                    <div key={m.name} style={styles.modelItem}>
                                        <div style={styles.modelBar}>
                                            <div style={{
                                                height: `${(m.layers / 120) * 100}%`,
                                                background: m.color,
                                                borderRadius: '4px 4px 0 0',
                                                width: '100%',
                                                transition: 'height 0.3s',
                                            }} />
                                        </div>
                                        <span style={{ color: m.color, fontWeight: 700, fontSize: '0.8rem' }}>{m.layers}층</span>
                                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{m.name}</span>
                                    </div>
                                ))}
                            </div>
                            <p style={styles.trainDesc}>
                                이렇게 깊은 네트워크에서 정규화 없이는 학습이 불가능합니다.
                                모든 현대 LLM은 각 Transformer 블록마다 정규화를 적용합니다.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* ── 한 걸음 더: 평균과 분산 ── */}
            <div style={{
                background: 'rgba(124, 92, 252, 0.08)',
                border: '1px solid rgba(124, 92, 252, 0.25)',
                borderRadius: 16,
                overflow: 'hidden',
                marginTop: 16,
            }}>
                <button
                    onClick={() => setShowDeepDive(!showDeepDive)}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: '#c4b5fd',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                    }}
                >
                    <span>{"🔬 한 걸음 더: 평균과 분산이 왜 중요할까?"}</span>
                    <span style={{
                        transform: showDeepDive ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s',
                        fontSize: '1.2rem',
                    }}>
                        ▼
                    </span>
                </button>
                {showDeepDive && (
                    <div style={{
                        padding: '0 24px 20px 24px',
                        color: '#cbd5e1',
                        fontSize: '0.92rem',
                        lineHeight: 1.8,
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                        }}>
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: 10,
                                background: 'rgba(124, 92, 252, 0.1)',
                                border: '1px solid rgba(124, 92, 252, 0.15)',
                            }}>
                                <strong style={{ color: '#a78bfa' }}>평균(Mean)</strong> = 데이터의 중심점.
                                모든 값을 더하고 개수로 나눈 것.<br />
                                <strong style={{ color: '#a78bfa' }}>분산(Variance)</strong> = 데이터가 평균으로부터 얼마나 퍼져 있는지를 나타내는 값.
                            </div>
                            <p>
                                정규화는 <strong>평균을 0, 분산을 1</strong>로 맞춰서 모든 뉴런이 비슷한 크기의 숫자로 작업하게 만듭니다.
                            </p>
                            <div style={{
                                padding: '14px 18px',
                                borderRadius: 10,
                                background: 'rgba(251, 191, 36, 0.08)',
                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                color: '#fbbf24',
                                fontSize: '0.88rem',
                            }}>
                                💡 <strong>비유:</strong> 키가 170cm인 반과 100cm인 반이 함께 체육을 하면 불공평하겠죠? 정규화하면 모든 반이 공정한 조건에서 경쟁할 수 있게 됩니다.
                                신경망에서도 마찬가지로, 각 층의 출력값 크기가 제각각이면 학습이 어려워집니다.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── 하단 네비게이션 ── */}
            <div style={styles.navRow}>
                <button onClick={() => router.push('/week10')} style={styles.navBtn}>← 10주차</button>
                <button onClick={() => router.push('/week13')} style={styles.navBtn}>13주차 →</button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '20px',
        maxWidth: 1100,
        margin: '0 auto',
        minHeight: '100vh',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '1rem',
        marginRight: 20,
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#f59e0b',
        fontFamily: 'var(--font-heading)',
    },
    // ── 탭 ──
    tabBar: {
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    tabBtn: {
        padding: '10px 18px',
        background: 'rgba(30, 25, 60, 0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.9rem',
        transition: 'all 0.2s',
    },
    tabBtnActive: {
        background: 'rgba(245, 158, 11, 0.2)',
        border: '1px solid #f59e0b',
        color: '#f59e0b',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    // ── 컨트롤 패널 ──
    controlPanel: {
        background: 'rgba(30, 25, 60, 0.5)',
        padding: 20,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
    },
    panelTitle: { color: '#fff', fontSize: '1.1rem', marginBottom: 10, fontFamily: 'var(--font-heading)' },
    desc: { color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6, fontSize: '0.9rem' },
    sliderRow: {
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    sliderLabel: { fontWeight: 600, fontSize: '0.9rem' },
    warningBox: {
        marginTop: 10,
        padding: '10px 14px',
        background: 'rgba(244, 63, 94, 0.15)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        borderRadius: 8,
        color: '#f43f5e',
        fontSize: '0.85rem',
    },
    // ── 시각화 ──
    vizRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap',
    },
    vizCard: {
        flex: 1,
        minWidth: 280,
        background: 'rgba(15, 23, 42, 0.6)',
        padding: 16,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        minHeight: 260,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    scatterBox: {
        position: 'relative',
        width: '100%',
        height: 180,
        margin: '16px 0',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        overflow: 'hidden',
    },
    dot: {
        position: 'absolute',
        width: 7,
        height: 7,
        borderRadius: '50%',
    },
    axis: {
        position: 'absolute',
        top: '50%',
        left: 0,
        width: '100%',
        height: 1,
        background: 'rgba(255,255,255,0.15)',
    },
    statLabel: {
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        fontFamily: 'monospace',
    },
    arrowContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#64748b',
        padding: '0 8px',
    },
    rmsValue: {
        fontSize: '0.8rem',
        color: '#f59e0b',
        fontWeight: 'bold',
        marginTop: 5,
    },
    opBadge: {
        fontSize: '0.8rem',
        color: '#fff',
        fontWeight: 'bold',
        background: '#f59e0b',
        padding: '2px 8px',
        borderRadius: 4,
        marginTop: 5,
    },
    // ── 수식 ──
    formulaBox: {
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: 12,
        padding: 20,
        textAlign: 'center',
    },
    formulaTitle: { color: '#f59e0b', fontWeight: 700, marginBottom: 8 },
    formula: {
        fontFamily: 'monospace',
        fontSize: '1.1rem',
        color: '#fff',
        background: 'rgba(0,0,0,0.3)',
        padding: '10px 16px',
        borderRadius: 8,
        display: 'inline-block',
        margin: '8px 0',
    },
    formulaDesc: { color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 8, lineHeight: 1.5 },
    // ── Norm 비교 ──
    normBtnRow: {
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
    },
    normBtn: {
        padding: '10px 20px',
        background: 'transparent',
        border: '2px solid',
        borderRadius: 10,
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: '0.9rem',
        transition: 'all 0.2s',
    },
    dataPanel: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        background: 'rgba(15, 23, 42, 0.5)',
        padding: '12px 16px',
        borderRadius: 10,
    },
    dataPanelTitle: { color: '#fff', fontWeight: 600, fontFamily: 'monospace' },
    dataValues: { display: 'flex', gap: 6, flexWrap: 'wrap' },
    dataChip: {
        background: 'rgba(255,255,255,0.1)',
        padding: '4px 10px',
        borderRadius: 6,
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        color: '#e2e8f0',
    },
    barChartPanel: {
        background: 'rgba(15, 23, 42, 0.6)',
        padding: 20,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
    },
    barChart: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        height: 160,
    },
    barCol: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 40,
        height: '100%',
        justifyContent: 'center',
    },
    barTop: {
        width: '100%',
        borderRadius: '4px 4px 0 0',
        transition: 'height 0.3s',
    },
    barZeroLine: {
        width: '100%',
        height: 1,
        background: 'rgba(255,255,255,0.3)',
    },
    barBottom: {
        width: '100%',
        borderRadius: '0 0 4px 4px',
        transition: 'height 0.3s',
    },
    barLabel: {
        color: '#94a3b8',
        fontSize: '0.7rem',
        fontFamily: 'monospace',
        marginTop: 4,
    },
    // ── 비교 테이블 ──
    compTable: {
        overflowX: 'auto',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.85rem',
    },
    th: {
        padding: '10px 12px',
        textAlign: 'left',
        background: 'rgba(30, 25, 60, 0.8)',
        color: '#fff',
        fontWeight: 700,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    td: {
        padding: '10px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
    },
    // ── 훈련 시뮬레이션 ──
    trainBtn: {
        padding: '12px 28px',
        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
        border: 'none',
        borderRadius: 12,
        color: '#fff',
        fontWeight: 700,
        fontSize: '1rem',
        cursor: 'pointer',
        alignSelf: 'flex-start',
    },
    trainChartRow: {
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
    },
    trainCard: {
        flex: 1,
        minWidth: 280,
        background: 'rgba(15, 23, 42, 0.6)',
        padding: 16,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
    },
    lossChart: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: 3,
        height: 120,
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 8,
        padding: '8px 4px',
    },
    lossBarCol: {
        flex: 1,
        height: '100%',
        display: 'flex',
        alignItems: 'flex-end',
    },
    lossBar: {
        width: '100%',
        borderRadius: '2px 2px 0 0',
        transition: 'height 0.2s',
        minHeight: 2,
    },
    trainStats: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 8,
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        color: '#94a3b8',
    },
    trainDesc: {
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        marginTop: 8,
        textAlign: 'center',
    },
    resultBox: {
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 12,
        padding: 16,
        color: '#fbbf24',
        lineHeight: 1.6,
        fontSize: '0.9rem',
    },
    // ── 레이어 차트 ──
    layerChart: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: 2,
        height: 140,
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 8,
        padding: '8px 4px',
    },
    layerBarCol: {
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    layerBar: {
        width: '100%',
        borderRadius: '2px 2px 0 0',
        transition: 'height 0.3s',
        minHeight: 2,
    },
    layerLabel: {
        color: '#64748b',
        fontSize: '0.6rem',
        marginTop: 2,
    },
    // ── 모델 비교 ──
    modelCompare: {
        background: 'rgba(30, 25, 60, 0.5)',
        padding: 20,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
    },
    modelRow: {
        display: 'flex',
        justifyContent: 'center',
        gap: 24,
        marginBottom: 12,
    },
    modelItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
    },
    modelBar: {
        width: 40,
        height: 100,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'flex-end',
        overflow: 'hidden',
    },
    // ── Theory ──
    theoryCard: {
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: 14,
        padding: 20,
    },
    theoryTitle: {
        color: '#f59e0b',
        fontSize: '1.1rem',
        fontWeight: 700,
        marginBottom: 10,
        fontFamily: 'var(--font-heading)',
    },
    theoryContent: {
        color: '#cbd5e1',
        fontSize: '0.9rem',
        lineHeight: 1.7,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    // ── 공통 ──
    infoBox: {
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        color: '#10b981',
        padding: 16,
        borderRadius: 12,
        textAlign: 'center',
        lineHeight: 1.6,
        fontSize: '0.9rem',
    },
    navRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 30,
        paddingBottom: 30,
    },
    navBtn: {
        padding: '10px 24px',
        background: 'rgba(30, 25, 60, 0.5)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 10,
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 600,
    },
};
