'use client';

import { useState, useMemo, useCallback } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';

const SCENARIOS = [
    {
        id: 'fox',
        prefix: "The quick brown fox jumps over the",
        logits: { 'dog': 8.0, 'lazy': 5.0, 'moon': 2.0, 'fence': 4.0, 'log': 3.0 }
    },
    {
        id: 'eat',
        prefix: "I am so hungry, I want to eat",
        logits: { 'pizza': 7.0, 'apple': 5.0, 'homework': -2.0, 'shoe': -1.0, 'burger': 6.5 }
    },
    {
        id: 'code',
        prefix: "def hello_world(): print(",
        logits: { '"Hello"': 9.0, 'x': 3.0, 'return': 1.0, 'error': 0.5, 'None': 2.0 }
    },
    {
        id: 'korean',
        prefix: "오늘 날씨가 정말",
        logits: { '좋다': 7.5, '춥다': 5.0, '덥다': 4.5, '흐리다': 3.0, '미쳤다': 1.0 }
    },
];

export default function PredictionLab() {
    const [scenarioId, setScenarioId] = useState('fox');
    const [temp, setTemp] = useState(1.0);
    const [generatedWord, setGeneratedWord] = useState(null);
    const [isSpinning, setIsSpinning] = useState(false);

    // Sampling options
    const [useTopK, setUseTopK] = useState(false);
    const [topK, setTopK] = useState(3);
    const [useTopP, setUseTopP] = useState(false);
    const [topP, setTopP] = useState(0.9);

    const [showDeepDive, setShowDeepDive] = useState(false);

    // Custom mode
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customPrefix, setCustomPrefix] = useState("나는 오늘");
    const [customEntries, setCustomEntries] = useState([
        { word: '학교에', logit: 6.0 },
        { word: '집에', logit: 5.0 },
        { word: '공원에', logit: 3.0 },
        { word: '달나라에', logit: -1.0 },
        { word: '바다에', logit: 2.5 },
    ]);

    const currentScenario = isCustomMode
        ? { id: 'custom', prefix: customPrefix, logits: Object.fromEntries(customEntries.map(e => [e.word, e.logit])) }
        : SCENARIOS.find(s => s.id === scenarioId);

    // Softmax with Temperature
    const rawProbabilities = useMemo(() => {
        const logits = currentScenario.logits;
        const keys = Object.keys(logits);

        const expValues = keys.map(k => Math.exp(logits[k] / temp));
        const sumExp = expValues.reduce((a, b) => a + b, 0);

        return keys.map((k, i) => ({
            word: k,
            prob: expValues[i] / sumExp,
            logit: logits[k]
        })).sort((a, b) => b.prob - a.prob);
    }, [currentScenario, temp]);

    // Apply Top-k / Top-p filtering
    const probabilities = useMemo(() => {
        let filtered = [...rawProbabilities];

        // Top-k: keep only top-k items
        if (useTopK) {
            filtered = filtered.slice(0, topK);
        }

        // Top-p: keep items until cumulative prob >= topP
        if (useTopP) {
            let cumProb = 0;
            const topPFiltered = [];
            for (const item of filtered) {
                topPFiltered.push(item);
                cumProb += item.prob;
                if (cumProb >= topP) break;
            }
            filtered = topPFiltered;
        }

        // Renormalize
        const sumProb = filtered.reduce((s, item) => s + item.prob, 0);
        return filtered.map(item => ({ ...item, filteredProb: item.prob / sumProb }));
    }, [rawProbabilities, useTopK, topK, useTopP, topP]);

    const handleSpin = () => {
        setIsSpinning(true);
        setGeneratedWord(null);

        const r = Math.random();
        let cum = 0;
        let selected = '';
        for (let item of probabilities) {
            cum += item.filteredProb;
            if (r <= cum) {
                selected = item.word;
                break;
            }
        }

        setTimeout(() => {
            setGeneratedWord(selected);
            setIsSpinning(false);
        }, 800);
    };

    const updateCustomEntry = useCallback((idx, field, value) => {
        setCustomEntries(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: field === 'logit' ? parseFloat(value) || 0 : value };
            return next;
        });
    }, []);

    const addCustomEntry = () => {
        if (customEntries.length < 8) {
            setCustomEntries(prev => [...prev, { word: '새단어', logit: 1.0 }]);
        }
    };

    const removeCustomEntry = (idx) => {
        if (customEntries.length > 2) {
            setCustomEntries(prev => prev.filter((_, i) => i !== idx));
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <Breadcrumb
                items={[{ label: '2주차 인트로', href: '/week2/intro' }]}
                current="다음 단어 예측기"
            />
            <div style={styles.header}>
                <div style={styles.headerTitle}>
                    <span style={{ fontSize: '1.5rem', marginRight: 8 }}>🎲</span>
                    <span style={{ fontWeight: 700 }}>다음 단어 예측기 (Next Token Prediction)</span>
                </div>
            </div>

            <div style={styles.content}>
                {/* Mode Toggle */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        style={{
                            ...styles.modeBtn,
                            background: !isCustomMode ? 'var(--accent-nova)' : 'rgba(255,255,255,0.05)',
                            color: !isCustomMode ? '#fff' : 'var(--text-secondary)',
                        }}
                        onClick={() => setIsCustomMode(false)}
                    >
                        📋 시나리오 모드
                    </button>
                    <button
                        style={{
                            ...styles.modeBtn,
                            background: isCustomMode ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                            color: isCustomMode ? '#000' : 'var(--text-secondary)',
                        }}
                        onClick={() => setIsCustomMode(true)}
                    >
                        ✏️ 자유 입력 모드
                    </button>
                </div>

                <div style={styles.grid2}>
                    {/* 1. Context */}
                    <div style={styles.card}>
                        <h3 style={styles.label}>1. 문맥 선택 (Context)</h3>
                        {!isCustomMode ? (
                            <>
                                <div style={styles.btnGroup}>
                                    {SCENARIOS.map(s => (
                                        <button
                                            key={s.id}
                                            style={{
                                                ...styles.scenarioBtn,
                                                background: s.id === scenarioId ? 'var(--accent-nova)' : 'rgba(255,255,255,0.05)',
                                                color: s.id === scenarioId ? '#fff' : 'var(--text-secondary)',
                                            }}
                                            onClick={() => { setScenarioId(s.id); setGeneratedWord(null); }}
                                        >
                                            {s.id === 'fox' ? '🦊 Fox' : s.id === 'eat' ? '🍕 Food' : s.id === 'code' ? '🐍 Code' : '🇰🇷 한국어'}
                                        </button>
                                    ))}
                                </div>
                                <div style={styles.previewBox}>
                                    {currentScenario.prefix} <span style={styles.blank}>
                                        {isSpinning ? '...' : generatedWord ? generatedWord : '_______'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>문맥 문장:</label>
                                    <input
                                        className="input-cosmic"
                                        value={customPrefix}
                                        onChange={(e) => setCustomPrefix(e.target.value)}
                                        placeholder="예: 나는 오늘"
                                        style={{ width: '100%', marginTop: 4 }}
                                    />
                                </div>
                                <div style={styles.previewBox}>
                                    {customPrefix} <span style={styles.blank}>
                                        {isSpinning ? '...' : generatedWord ? generatedWord : '_______'}
                                    </span>
                                </div>
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>후보 단어 &amp; Logit 값:</label>
                                        <button onClick={addCustomEntry} style={styles.addBtn} disabled={customEntries.length >= 8}>+ 추가</button>
                                    </div>
                                    {customEntries.map((entry, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                                            <input
                                                className="input-cosmic"
                                                value={entry.word}
                                                onChange={(e) => updateCustomEntry(idx, 'word', e.target.value)}
                                                style={{ flex: 2, fontSize: '0.85rem' }}
                                                placeholder="단어"
                                            />
                                            <input
                                                className="input-cosmic"
                                                type="number"
                                                value={entry.logit}
                                                onChange={(e) => updateCustomEntry(idx, 'logit', e.target.value)}
                                                style={{ flex: 1, fontSize: '0.85rem' }}
                                                step="0.5"
                                            />
                                            <button
                                                onClick={() => removeCustomEntry(idx)}
                                                style={styles.removeBtn}
                                                disabled={customEntries.length <= 2}
                                            >×</button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* 2. Temperature + Sampling Controls */}
                    <div style={styles.card}>
                        <h3 style={styles.label}>2. 샘플링 설정</h3>
                        <div style={{ padding: '0 10px' }}>
                            {/* Temperature */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Temperature</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>T = {temp.toFixed(1)}</span>
                                </div>
                                <input type="range" className="slider-cosmic" min="0.1" max="3.0" step="0.1" value={temp}
                                    onChange={(e) => setTemp(parseFloat(e.target.value))} style={{ width: '100%' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 2 }}>
                                    <span>🎯 집중 (0.1)</span><span>🌊 분산 (3.0)</span>
                                </div>
                            </div>

                            {/* Formula */}
                            <div style={styles.formulaBox}>
                                <code style={{ fontSize: '0.82rem', color: '#fbbf24' }}>P(wᵢ) = exp(zᵢ / T) / Σ exp(zⱼ / T)</code>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.5, textAlign: 'left' }}>
                                    <strong>z</strong> = logit (모델이 각 단어에 매긴 &quot;원점수&quot;, 높을수록 유력한 후보)<br/>
                                    <strong>exp</strong> = 지수 함수 (e ≈ 2.718을 z번 곱한 값, 점수 차이를 확률 차이로 증폭)<br/>
                                    <strong>T</strong> = Temperature (나누면 점수 차이가 줄어들어 확률이 고르게 됨)
                                </div>
                            </div>

                            {/* Top-k */}
                            <div style={styles.samplingOption}>
                                <label style={styles.checkLabel}>
                                    <input type="checkbox" checked={useTopK} onChange={(e) => setUseTopK(e.target.checked)} />
                                    <span>Top-k 샘플링</span>
                                </label>
                                {useTopK && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>k =</span>
                                        <input type="range" className="slider-cosmic" min="1" max={Object.keys(currentScenario.logits).length} step="1"
                                            value={topK} onChange={(e) => setTopK(parseInt(e.target.value))} style={{ flex: 1 }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace', width: 20 }}>{topK}</span>
                                    </div>
                                )}
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
                                    확률 상위 k개 단어만 후보로 남김
                                </p>
                            </div>

                            {/* Top-p */}
                            <div style={styles.samplingOption}>
                                <label style={styles.checkLabel}>
                                    <input type="checkbox" checked={useTopP} onChange={(e) => setUseTopP(e.target.checked)} />
                                    <span>Top-p (Nucleus) 샘플링</span>
                                </label>
                                {useTopP && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>p =</span>
                                        <input type="range" className="slider-cosmic" min="0.1" max="1.0" step="0.05"
                                            value={topP} onChange={(e) => setTopP(parseFloat(e.target.value))} style={{ flex: 1 }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa', fontFamily: 'monospace', width: 36 }}>{topP.toFixed(2)}</span>
                                    </div>
                                )}
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
                                    누적 확률이 p를 넘을 때까지의 단어만 후보로 남김<br/>
                                    (&quot;Nucleus&quot; = 핵심. 확률 분포의 핵심 부분만 남긴다는 뜻)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Probabilities Visualization */}
                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                        <h3 style={{ ...styles.label, marginBottom: 0 }}>3. 확률 분포 (Softmax → 필터링)</h3>
                        <button className="btn-nova" onClick={handleSpin} disabled={isSpinning} style={{ padding: '8px 24px' }}>
                            {isSpinning ? '🎲 굴리는 중...' : '🎲 단어 생성하기!'}
                        </button>
                    </div>

                    <div style={styles.barChart}>
                        {rawProbabilities.map((item) => {
                            const isFiltered = !probabilities.find(p => p.word === item.word);
                            const displayProb = isFiltered ? item.prob : (probabilities.find(p => p.word === item.word)?.filteredProb ?? item.prob);
                            return (
                                <div key={item.word} style={{ ...styles.barRow, opacity: isFiltered ? 0.25 : 1 }}>
                                    <div style={styles.barLabel}>
                                        {item.word}
                                        {isFiltered && <span style={{ fontSize: '0.65rem', color: '#f43f5e', marginLeft: 4 }}>✕</span>}
                                    </div>
                                    <div style={styles.barTrack}>
                                        <div style={{
                                            ...styles.barFill,
                                            width: `${displayProb * 100}%`,
                                            background: isFiltered ? 'rgba(255,255,255,0.1)' : (displayProb > 0.4 ? '#34d399' : 'rgba(52, 211, 153, 0.5)')
                                        }} />
                                        <span style={styles.probText}>
                                            {isFiltered ? '제외' : `${(displayProb * 100).toFixed(1)}%`}
                                        </span>
                                    </div>
                                    <div style={{ width: 50, fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace', textAlign: 'right' }}>
                                        z={item.logit.toFixed(1)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {(useTopK || useTopP) && (
                        <p style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: 10, textAlign: 'center' }}>
                            {useTopK && `Top-${topK}`}{useTopK && useTopP && ' + '}{useTopP && `Top-p(${topP.toFixed(2)})`} 적용 →
                            {' '}{probabilities.length}개 후보로 축소 후 재정규화(renormalize)
                        </p>
                    )}
                </div>

                {/* 4. Theory Section */}
                <div style={styles.card}>
                    <h3 style={styles.label}>🤖 언어 모델이 문장을 생성하는 방법</h3>
                    <div style={styles.theoryContent}>
                        <p>
                            <strong>1. 자기회귀(Autoregressive) 생성</strong><br />
                            GPT와 같은 언어 모델은 <strong>한 번에 하나의 토큰(단어)</strong>만 예측합니다.
                            예측한 토큰을 입력 뒤에 붙이고, 다시 다음 토큰을 예측하는 과정을 반복합니다.
                        </p>
                        <div style={styles.autoregBox}>
                            <div style={styles.arStep}><span style={{ color: 'var(--text-dim)' }}>입력:</span> <code>나는 오늘</code></div>
                            <div style={styles.arArrow}>↓ 예측</div>
                            <div style={styles.arStep}><span style={{ color: 'var(--text-dim)' }}>+1:</span> <code>나는 오늘 <strong style={{ color: '#34d399' }}>학교에</strong></code></div>
                            <div style={styles.arArrow}>↓ 예측</div>
                            <div style={styles.arStep}><span style={{ color: 'var(--text-dim)' }}>+2:</span> <code>나는 오늘 학교에 <strong style={{ color: '#34d399' }}>갔다</strong></code></div>
                            <div style={styles.arArrow}>↓ 예측</div>
                            <div style={styles.arStep}><span style={{ color: 'var(--text-dim)' }}>+3:</span> <code>나는 오늘 학교에 갔다 <strong style={{ color: '#f43f5e' }}>&lt;끝&gt;</strong></code></div>
                        </div>

                        <p>
                            <strong>2. Temperature(온도)</strong><br />
                            softmax 함수에 Temperature를 적용합니다: <code style={{ color: '#fbbf24' }}>P(wᵢ) = exp(zᵢ/T) / Σexp(zⱼ/T)</code><br />
                            T가 낮으면(→0) 가장 높은 logit에 집중, T가 높으면(→∞) 균등 분포에 가까워집니다.
                        </p>

                        <p>
                            <strong>3. Top-k 샘플링</strong><br />
                            확률이 높은 상위 k개의 토큰만 남기고 나머지는 제거합니다.
                            k가 작으면 안전하고 반복적, k가 크면 다양하지만 엉뚱한 단어가 나올 수 있습니다.
                        </p>

                        <p>
                            <strong>4. Top-p (Nucleus) 샘플링</strong><br />
                            누적 확률이 p를 넘을 때까지의 토큰만 남깁니다. 상황에 따라 후보 수가 유동적으로 변합니다.
                            예: 확실한 문맥이면 2~3개, 애매한 문맥이면 10개 이상.
                        </p>

                        <div style={styles.comparisonTable}>
                            <div style={styles.compRow}>
                                <div style={{ ...styles.compCell, fontWeight: 700, color: '#94a3b8' }}>방법</div>
                                <div style={{ ...styles.compCell, fontWeight: 700, color: '#94a3b8' }}>장점</div>
                                <div style={{ ...styles.compCell, fontWeight: 700, color: '#94a3b8' }}>단점</div>
                            </div>
                            <div style={styles.compRow}>
                                <div style={{ ...styles.compCell, color: '#34d399' }}>Greedy (T→0)</div>
                                <div style={styles.compCell}>가장 정확</div>
                                <div style={styles.compCell}>반복적, 재미없음</div>
                            </div>
                            <div style={styles.compRow}>
                                <div style={{ ...styles.compCell, color: '#3b82f6' }}>Top-k</div>
                                <div style={styles.compCell}>단순하고 효과적</div>
                                <div style={styles.compCell}>고정된 후보 수</div>
                            </div>
                            <div style={styles.compRow}>
                                <div style={{ ...styles.compCell, color: '#a78bfa' }}>Top-p</div>
                                <div style={styles.compCell}>유동적 후보 수</div>
                                <div style={styles.compCell}>p 값 튜닝 필요</div>
                            </div>
                            <div style={styles.compRow}>
                                <div style={{ ...styles.compCell, color: '#f59e0b' }}>T + Top-p</div>
                                <div style={styles.compCell}>실전 표준 조합</div>
                                <div style={styles.compCell}>파라미터 2개 조절</div>
                            </div>
                        </div>

                        <div style={styles.tipBox}>
                            <strong>💡 실전 팁:</strong> ChatGPT, Claude 등 대부분의 LLM API는
                            <strong> Temperature + Top-p</strong>를 동시에 사용합니다.
                            일반적으로 T=0.7, Top-p=0.9가 좋은 시작점입니다.
                        </div>
                    </div>
                </div>

                {/* 한 걸음 더: exp와 Softmax */}
                <div style={{
                    borderRadius: 12,
                    border: '1px solid rgba(124, 92, 252, 0.2)',
                    overflow: 'hidden',
                }}>
                    <button
                        onClick={() => setShowDeepDive(!showDeepDive)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'rgba(124, 92, 252, 0.08)',
                            border: 'none',
                            color: '#a78bfa',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        {showDeepDive ? '▼' : '▶'} 한 걸음 더: 왜 하필 exp(지수 함수)를 쓸까?
                    </button>
                    {showDeepDive && (
                        <div style={{
                            padding: 16,
                            background: 'rgba(124, 92, 252, 0.04)',
                            fontSize: '0.88rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.7,
                            textAlign: 'left',
                        }}>
                            <p style={{ marginBottom: 10 }}>
                                Softmax에서 <strong>exp</strong>를 쓰는 데에는 수학적인 이유가 있어요:
                            </p>
                            <p style={{ marginBottom: 8 }}>
                                <strong style={{ color: '#fbbf24' }}>1. 음수 → 양수 변환</strong> —
                                logit(원점수)은 음수일 수 있지만, 확률은 반드시 0 이상이어야 해요.
                                exp 함수는 어떤 수를 넣어도 항상 양수를 돌려주기 때문에 이 조건을 자연스럽게 만족합니다.
                            </p>
                            <p style={{ marginBottom: 8 }}>
                                <strong style={{ color: '#34d399' }}>2. 차이 증폭</strong> —
                                logit이 8과 5로 3 차이가 나면, exp(8) ≈ 2981 vs exp(5) ≈ 148로 약 <strong>20배</strong> 차이가 됩니다.
                                점수 차이가 조금만 나도 확률에서는 큰 차이로 나타나, &quot;확실한 답&quot;에 집중할 수 있어요.
                            </p>
                            <p>
                                <strong style={{ color: '#f87171' }}>3. 미분이 깔끔함</strong> —
                                exp의 미분은 자기 자신! (d/dx)eˣ = eˣ.
                                이 성질 덕분에 AI가 학습할 때(역전파, 5~7주차에서 배울 예정) 계산이 매우 효율적입니다.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        padding: '20px',
        maxWidth: 900,
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
    modeBtn: {
        flex: 1,
        padding: '10px 16px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 600,
        transition: 'all 0.2s',
    },
    grid2: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
    },
    card: {
        background: 'rgba(15, 10, 40, 0.6)',
        borderRadius: 16,
        padding: 20,
        border: '1px solid rgba(52, 211, 153, 0.2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    },
    label: {
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        marginBottom: 12,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    btnGroup: {
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    scenarioBtn: {
        flex: 1,
        padding: '8px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
        fontSize: '0.85rem',
        transition: 'all 0.2s',
        minWidth: 'fit-content',
    },
    previewBox: {
        background: 'rgba(0,0,0,0.3)',
        padding: 16,
        borderRadius: 8,
        fontSize: '1.05rem',
        border: '1px solid rgba(255,255,255,0.1)',
        minHeight: 60,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        lineHeight: 1.6,
    },
    blank: {
        borderBottom: '2px solid #34d399',
        minWidth: 60,
        textAlign: 'center',
        marginLeft: 8,
        color: '#34d399',
        fontWeight: 'bold',
    },
    addBtn: {
        padding: '3px 10px',
        borderRadius: 6,
        border: '1px solid rgba(52,211,153,0.3)',
        background: 'rgba(52,211,153,0.1)',
        color: '#34d399',
        fontSize: '0.75rem',
        cursor: 'pointer',
    },
    removeBtn: {
        width: 24,
        height: 24,
        borderRadius: 6,
        border: '1px solid rgba(244,63,94,0.3)',
        background: 'rgba(244,63,94,0.1)',
        color: '#f43f5e',
        cursor: 'pointer',
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    formulaBox: {
        textAlign: 'center',
        padding: '8px 12px',
        borderRadius: 8,
        background: 'rgba(251,191,36,0.08)',
        border: '1px solid rgba(251,191,36,0.2)',
        marginBottom: 14,
    },
    samplingOption: {
        padding: '10px 0',
        borderTop: '1px solid rgba(255,255,255,0.06)',
    },
    checkLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        fontWeight: 600,
        cursor: 'pointer',
    },
    barChart: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    barRow: {
        display: 'flex',
        alignItems: 'center',
        transition: 'opacity 0.3s',
    },
    barLabel: {
        width: 80,
        fontSize: '0.85rem',
        textAlign: 'right',
        paddingRight: 12,
        color: 'var(--text-secondary)',
    },
    barTrack: {
        flex: 1,
        height: 24,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    barFill: {
        height: '100%',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    probText: {
        position: 'absolute',
        right: 8,
        fontSize: '0.75rem',
        fontWeight: 600,
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    },
    theoryContent: {
        color: '#cbd5e1',
        fontSize: '0.9rem',
        lineHeight: 1.6,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    autoregBox: {
        padding: 16,
        borderRadius: 10,
        background: 'rgba(52,211,153,0.06)',
        border: '1px solid rgba(52,211,153,0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        fontFamily: 'monospace',
        fontSize: '0.88rem',
    },
    arStep: {
        padding: '4px 8px',
    },
    arArrow: {
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.8rem',
    },
    comparisonTable: {
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    compRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    compCell: {
        padding: '8px 12px',
        fontSize: '0.82rem',
    },
    tipBox: {
        padding: 14,
        borderRadius: 10,
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        fontSize: '0.85rem',
        lineHeight: 1.6,
    },
};
