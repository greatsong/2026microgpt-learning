'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/layout/Breadcrumb';

// ── 탭 구성 ──
const TABS = [
    { id: 'builder', label: '🔢 벡터 만들기', title: '원-핫 벡터 만들기' },
    { id: 'distance', label: '📏 거리 비교', title: '유클리드 거리 비교' },
    { id: 'memory', label: '💾 메모리 계산', title: '메모리 사용량' },
    { id: 'compare', label: '⚡ 인코딩 비교', title: '인코딩 방식 비교' },
];

// ── Tab 1: 원-핫 벡터 만들기 ──
function VectorBuilder() {
    const [words, setWords] = useState(['고양이', '강아지', '자동차', '비행기', '피자']);
    const [newWord, setNewWord] = useState('');
    const [selected, setSelected] = useState(0);

    const addWord = () => {
        const w = newWord.trim();
        if (!w || words.includes(w)) return;
        setWords((prev) => [...prev, w]);
        setNewWord('');
    };

    const removeWord = (idx) => {
        if (words.length <= 2) return;
        setWords((prev) => prev.filter((_, i) => i !== idx));
        if (selected >= idx && selected > 0) setSelected(selected - 1);
    };

    return (
        <div style={styles.tabContent}>
            <p style={styles.desc}>
                단어를 추가/삭제하며 원-핫 벡터가 어떻게 변하는지 관찰하세요!
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input className="input-cosmic" placeholder="새 단어 입력..." value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addWord()}
                    maxLength={8} style={{ flex: 1, fontSize: '0.85rem' }} />
                <button className="btn-nova" onClick={addWord} disabled={!newWord.trim()}
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    <span>+ 추가</span>
                </button>
            </div>

            <div style={styles.wordGrid}>
                {words.map((w, i) => (
                    <div key={i} style={{
                        ...styles.wordChip,
                        ...(selected === i ? styles.wordChipActive : {}),
                    }} onClick={() => setSelected(i)}>
                        <span>{w}</span>
                        {words.length > 2 && (
                            <button onClick={(e) => { e.stopPropagation(); removeWord(i); }}
                                style={styles.removeBtn}>×</button>
                        )}
                    </div>
                ))}
            </div>

            <div style={styles.vectorPanel}>
                <div style={styles.vectorHeader}>
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>&quot;{words[selected]}&quot;</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        의 원-핫 벡터 ({words.length}차원)
                    </span>
                </div>
                <div style={styles.vectorGrid}>
                    {words.map((w, i) => (
                        <div key={i} style={styles.vectorCell}>
                            <div style={{
                                ...styles.cellValue,
                                background: i === selected ? 'rgba(245, 158, 11, 0.3)' : 'rgba(107, 114, 128, 0.1)',
                                border: `1px solid ${i === selected ? '#f59e0b' : 'rgba(107, 114, 128, 0.2)'}`,
                                color: i === selected ? '#fbbf24' : '#6b7280',
                                fontWeight: i === selected ? 800 : 400,
                                transform: i === selected ? 'scale(1.15)' : 'scale(1)',
                            }}>
                                {i === selected ? '1' : '0'}
                            </div>
                            <span style={styles.cellLabel}>{w}</span>
                        </div>
                    ))}
                </div>
                <div style={styles.statsRow}>
                    <div style={styles.statBox}>
                        <span style={styles.statLabel}>차원 수</span>
                        <span style={{ ...styles.statValue, color: words.length > 10 ? '#f43f5e' : '#10b981' }}>
                            {words.length}
                        </span>
                    </div>
                    <div style={styles.statBox}>
                        <span style={styles.statLabel}>0의 비율</span>
                        <span style={styles.statValue}>
                            {((1 - 1 / words.length) * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div style={styles.statBox}>
                        <span style={styles.statLabel}>1의 개수</span>
                        <span style={{ ...styles.statValue, color: '#f59e0b' }}>1</span>
                    </div>
                </div>
            </div>

            <div style={styles.tipBox}>
                💡 단어를 계속 추가해보세요! 벡터 차원이 커지면서 0이 많아지는 <strong>희소 벡터(Sparse Vector)</strong>가 됩니다.
            </div>
        </div>
    );
}

// ── Tab 2: 거리 비교 ──
function DistanceComparison() {
    const words = ['고양이', '강아지', '자동차', '비행기', '피자', '햄버거', '사과'];
    const [wordA, setWordA] = useState(0);
    const [wordB, setWordB] = useState(1);

    const semanticGroups = { '고양이': 0, '강아지': 0, '자동차': 1, '비행기': 1, '피자': 2, '햄버거': 2, '사과': 2 };
    const sameGroup = semanticGroups[words[wordA]] === semanticGroups[words[wordB]];

    return (
        <div style={styles.tabContent}>
            <p style={styles.desc}>
                두 단어를 선택하면 원-핫 벡터 간 <strong>유클리드 거리</strong>를 계산합니다.
            </p>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                    <label className="label-cosmic" style={{ fontSize: '0.8rem' }}>단어 A</label>
                    <div style={styles.wordSelectGrid}>
                        {words.map((w, i) => (
                            <button key={i} onClick={() => setWordA(i)}
                                style={{ ...styles.selectBtn, ...(wordA === i ? styles.selectBtnActiveA : {}) }}>
                                {w}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                    <label className="label-cosmic" style={{ fontSize: '0.8rem' }}>단어 B</label>
                    <div style={styles.wordSelectGrid}>
                        {words.map((w, i) => (
                            <button key={i} onClick={() => setWordB(i)}
                                style={{ ...styles.selectBtn, ...(wordB === i ? styles.selectBtnActiveB : {}) }}>
                                {w}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={styles.distanceResult}>
                <div style={styles.distPair}>
                    <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '1.1rem' }}>{words[wordA]}</span>
                    <span style={{ color: 'var(--text-dim)' }}>↔</span>
                    <span style={{ fontWeight: 700, color: '#3b82f6', fontSize: '1.1rem' }}>{words[wordB]}</span>
                </div>
                <div style={styles.distValue}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>유클리드 거리</span>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'monospace' }}>
                        {wordA === wordB ? '0' : '√2 ≈ 1.414'}
                    </span>
                </div>
                {wordA !== wordB && (
                    <div style={{ width: '100%' }}>
                        <div style={{
                            padding: '10px 14px', borderRadius: 8,
                            background: sameGroup ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                            border: `1px solid ${sameGroup ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                        }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: sameGroup ? '#10b981' : '#f43f5e' }}>
                                {sameGroup ? '🧲 상식적으로 비슷한 단어인데...' : '🔀 상식적으로 다른 단어인데...'}
                            </span>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                                원-핫에서는 거리가 <strong>항상 √2</strong>로 동일! 의미의 유사성을 전혀 반영하지 못합니다.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div style={styles.distTable}>
                <label className="label-cosmic" style={{ fontSize: '0.78rem' }}>📊 전체 거리 행렬</label>
                <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}></th>
                                {words.map((w) => <th key={w} style={styles.th}>{w}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {words.map((w1, i) => (
                                <tr key={w1}>
                                    <td style={{ ...styles.td, fontWeight: 700, color: 'var(--text-secondary)' }}>{w1}</td>
                                    {words.map((_, j) => (
                                        <td key={j} style={{ ...styles.td, color: i === j ? '#10b981' : '#f43f5e', fontWeight: i === j ? 700 : 400 }}>
                                            {i === j ? '0' : '√2'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>
                    대각선(자기 자신) 빼고 전부 √2 — <strong>이것이 원-핫의 한계!</strong>
                </p>
            </div>
        </div>
    );
}

// ── Tab 3: 메모리 계산 ──
function MemoryCalculator() {
    const [vocabSize, setVocabSize] = useState(100);
    const [sentenceLen, setSentenceLen] = useState(10);

    const oneHotBytes = vocabSize * 4;
    const sentenceBytes = oneHotBytes * sentenceLen;
    const embDim = Math.min(768, Math.max(32, Math.round(Math.sqrt(vocabSize) * 2)));
    const embBytes = embDim * 4;
    const embSentenceBytes = embBytes * sentenceLen;
    const savings = sentenceBytes > 0 ? ((1 - embSentenceBytes / sentenceBytes) * 100) : 0;

    const formatBytes = (b) => {
        if (b < 1024) return `${b} B`;
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
        return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    };

    const realModels = [
        { name: 'GPT-2', vocab: 50257, emb: 768 },
        { name: 'GPT-3', vocab: 50257, emb: 12288 },
        { name: 'LLaMA-2', vocab: 32000, emb: 4096 },
        { name: 'GPT-4', vocab: 100000, emb: '?' },
    ];

    return (
        <div style={styles.tabContent}>
            <p style={styles.desc}>
                슬라이더로 단어장 크기를 조절하고 메모리 사용량을 비교해보세요!
            </p>
            <div style={styles.sliderGroup}>
                <div style={styles.sliderRow}>
                    <span style={styles.sliderLabel}>단어장 크기</span>
                    <input type="range" className="slider-cosmic" min={10} max={100000} step={10}
                        value={vocabSize} onChange={(e) => setVocabSize(parseInt(e.target.value))} style={{ flex: 1 }} />
                    <span style={styles.sliderVal}>{vocabSize.toLocaleString()}</span>
                </div>
                <div style={styles.sliderRow}>
                    <span style={styles.sliderLabel}>문장 길이</span>
                    <input type="range" className="slider-cosmic" min={1} max={100} step={1}
                        value={sentenceLen} onChange={(e) => setSentenceLen(parseInt(e.target.value))} style={{ flex: 1 }} />
                    <span style={styles.sliderVal}>{sentenceLen}토큰</span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ ...styles.memCard, border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>원-핫 인코딩</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f43f5e' }}>{formatBytes(sentenceBytes)}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{vocabSize.toLocaleString()}차원 × {sentenceLen}토큰</span>
                </div>
                <div style={{ ...styles.memCard, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>임베딩 (참고)</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{formatBytes(embSentenceBytes)}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{embDim}차원 × {sentenceLen}토큰</span>
                </div>
                <div style={{ ...styles.memCard, border: '1px solid rgba(124, 92, 252, 0.3)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>절감률</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c5cfc' }}>{savings.toFixed(1)}%</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>메모리 절약</span>
                </div>
            </div>
            <div className="glass-card" style={{ padding: 14 }}>
                <label className="label-cosmic" style={{ fontSize: '0.78rem' }}>🤖 실제 모델의 원-핫 vs 임베딩</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {realModels.map((m) => (
                        <div key={m.name} style={styles.modelRow}>
                            <span style={{ fontWeight: 700, minWidth: 70, fontSize: '0.82rem' }}>{m.name}</span>
                            <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: '0.72rem', color: '#f43f5e' }}>원-핫: {formatBytes(m.vocab * 4)}</span>
                                <span style={{ color: 'var(--text-dim)' }}>→</span>
                                <span style={{ fontSize: '0.72rem', color: '#10b981' }}>임베딩: {typeof m.emb === 'number' ? formatBytes(m.emb * 4) : '?'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Tab 4: 인코딩 방식 비교 ──
function EncodingComparison() {
    const words = ['고양이', '강아지', '자동차', '비행기', '피자'];
    const methods = [
        { name: '인덱스 인코딩', emoji: '#️⃣', description: '각 단어에 번호를 매기기', vectors: words.map((_, i) => String(i)), pros: ['매우 간단', '메모리 효율적 (숫자 1개)'], cons: ['크기 관계가 생겨버림 (고양이 < 강아지?)', '연산 불가능 (3 - 1 = 자동차?)'], color: '#94a3b8' },
        { name: '원-핫 인코딩', emoji: '1️⃣', description: '단어마다 하나의 위치만 1', vectors: words.map((_, i) => `[${words.map((__, j) => j === i ? '1' : '0').join(',')}]`), pros: ['크기 관계 없음 (동등)', '간단하고 명확'], cons: ['차원이 단어 수만큼 커짐', '모든 거리가 동일 (의미 무시)'], color: '#f59e0b' },
        { name: '임베딩 (4주차!)', emoji: '✨', description: '의미를 담은 밀집 벡터', vectors: ['[0.90, -0.30, 0.30]', '[0.70, -0.10, 0.60]', '[-0.50, 0.70, 0.10]', '[-0.30, 0.80, 0.30]', '[0.33, 0.71, 0.22]'], pros: ['의미적 유사성 반영', '고정된 작은 차원 (효율적)'], cons: ['학습이 필요함 (데이터 필요)', '해석이 어려울 수 있음'], color: '#7c5cfc' },
    ];
    const [activeMethod, setActiveMethod] = useState(1);

    return (
        <div style={styles.tabContent}>
            <p style={styles.desc}>세 가지 인코딩 방식을 비교해보세요. 각각의 장단점이 있습니다!</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {methods.map((m, i) => (
                    <button key={i} onClick={() => setActiveMethod(i)} style={{
                        flex: 1, minWidth: 120, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        border: activeMethod === i ? `2px solid ${m.color}` : '1px solid rgba(124, 92, 252, 0.15)',
                        background: activeMethod === i ? `${m.color}15` : 'transparent',
                        color: activeMethod === i ? m.color : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center',
                    }}>{m.emoji} {m.name}</button>
                ))}
            </div>
            <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 10 }}>{methods[activeMethod].description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {words.map((w, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6, background: 'rgba(15, 10, 40, 0.4)' }}>
                            <span style={{ fontWeight: 600, minWidth: 60, fontSize: '0.85rem' }}>{w}</span>
                            <span style={{ color: 'var(--text-dim)' }}>→</span>
                            <code style={{ fontSize: '0.78rem', color: methods[activeMethod].color, fontWeight: 600 }}>{methods[activeMethod].vectors[i]}</code>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180, padding: 14, borderRadius: 10, background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#10b981' }}>장점</span>
                    <ul style={{ paddingLeft: 16, marginTop: 6 }}>
                        {methods[activeMethod].pros.map((p, i) => (<li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{p}</li>))}
                    </ul>
                </div>
                <div style={{ flex: 1, minWidth: 180, padding: 14, borderRadius: 10, background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.15)' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f43f5e' }}>단점</span>
                    <ul style={{ paddingLeft: 16, marginTop: 6 }}>
                        {methods[activeMethod].cons.map((c, i) => (<li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{c}</li>))}
                    </ul>
                </div>
            </div>
            <div style={styles.tipBox}>
                💡 원-핫 인코딩은 간단하지만 한계가 명확합니다. 다음 주차에서 이 문제를 해결하는 <strong style={{ color: '#7c5cfc' }}>임베딩</strong>을 배워요!
            </div>
        </div>
    );
}

// ── 메인 ──
export default function Week3Page() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('builder');

    const handleComplete = () => {
        if (typeof window !== 'undefined') {
            try {
                const progress = JSON.parse(localStorage.getItem('microgpt-progress') || '{}');
                progress['3'] = true;
                localStorage.setItem('microgpt-progress', JSON.stringify(progress));
                window.dispatchEvent(new Event('microgpt-progress-update'));
            } catch {}
        }
    };

    const renderTab = () => {
        switch (activeTab) {
            case 'builder': return <VectorBuilder />;
            case 'distance': return <DistanceComparison />;
            case 'memory': return <MemoryCalculator />;
            case 'compare': return <EncodingComparison />;
            default: return null;
        }
    };

    return (
        <div style={styles.pageContainer}>
            <Breadcrumb
                items={[{ label: '3주차 인트로', href: '/week3/intro' }]}
                current="원-핫 인코딩 실험실"
            />
            <div style={styles.header}>
                <div>
                    <h2 style={styles.weekTitle}>3주차</h2>
                    <h1 style={styles.moduleTitle}><span className="text-gradient">원-핫 인코딩 실험실</span></h1>
                    <p style={styles.headerDesc}>원-핫 벡터를 직접 만들고, 한계를 체험해보세요! 🔢</p>
                </div>
            </div>

            <div style={styles.tabBar}>
                {TABS.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        style={{ ...styles.tabBtn, ...(activeTab === tab.id ? styles.tabBtnActive : {}) }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={styles.contentArea}>{renderTab()}</div>

            <div className="glass-card" style={styles.theoryCard}>
                <label className="label-cosmic">🤖 원-핫 인코딩이 실제로 쓰이는 곳</label>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    <p style={{ marginBottom: 10 }}>
                        <strong>1. 분류 문제의 출력층</strong><br />
                        &quot;이 사진은 고양이/강아지/자동차 중 뭐야?&quot; → 정답 레이블을 원-핫으로 표현합니다.<br />
                        [1, 0, 0] = 고양이, [0, 1, 0] = 강아지
                    </p>
                    <p style={{ marginBottom: 10 }}>
                        <strong>2. 임베딩 레이어의 입력</strong><br />
                        실제 GPT에서 원-핫 벡터는 임베딩 행렬과 곱해져서 밀집 벡터로 변환됩니다!<br />
                        <code style={{ color: '#f59e0b', fontSize: '0.8rem' }}>원-핫 × 임베딩 행렬 = 임베딩 벡터</code>
                    </p>
                    <p>
                        <strong>3. 4주차 미리보기</strong><br />
                        다음 주에는 이 원-핫의 한계를 해결하는 <strong style={{ color: '#7c5cfc' }}>임베딩</strong>을 배웁니다!
                        단어의 의미를 담은 3D 은하수를 직접 체험해보세요. 🌌
                    </p>
                </div>
            </div>

            <div style={styles.footer}>
                <button className="btn-nova" onClick={() => { handleComplete(); router.push('/week4/intro'); }}
                    style={{ padding: '12px 32px', fontSize: '1rem' }}>
                    <span>🌌 다음: 임베딩 은하수 →</span>
                </button>
            </div>
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: 800, margin: '0 auto', padding: '24px 20px 60px', minHeight: '100vh' },
    header: { display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 },
    backBtn: { padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-dim)', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', marginTop: 4 },
    weekTitle: { fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 },
    moduleTitle: { fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 },
    headerDesc: { fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 },
    tabBar: { display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 },
    tabBtn: { padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-dim)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' },
    tabBtnActive: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' },
    contentArea: { marginBottom: 24 },
    tabContent: { display: 'flex', flexDirection: 'column', gap: 14 },
    desc: { fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4 },
    wordGrid: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
    wordChip: { padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.06)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' },
    wordChipActive: { background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)' },
    removeBtn: { width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
    vectorPanel: { padding: 16, borderRadius: 12, background: 'rgba(15, 10, 40, 0.5)', border: '1px solid rgba(245, 158, 11, 0.15)' },
    vectorHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
    vectorGrid: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
    vectorCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
    cellValue: { width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontFamily: 'monospace', border: '1px solid', transition: 'all 0.3s' },
    cellLabel: { fontSize: '0.65rem', color: 'var(--text-dim)', maxWidth: 40, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    statsRow: { display: 'flex', gap: 10 },
    statBox: { flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(124, 92, 252, 0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 },
    statLabel: { fontSize: '0.7rem', color: 'var(--text-dim)' },
    statValue: { fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' },
    tipBox: { padding: 14, borderRadius: 10, background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 },
    wordSelectGrid: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 },
    selectBtn: { padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(124, 92, 252, 0.15)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s' },
    selectBtnActiveA: { background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#f59e0b', fontWeight: 700 },
    selectBtnActiveB: { background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', color: '#3b82f6', fontWeight: 700 },
    distanceResult: { padding: 20, borderRadius: 12, background: 'rgba(15, 10, 40, 0.5)', border: '1px solid rgba(245, 158, 11, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
    distPair: { display: 'flex', alignItems: 'center', gap: 12 },
    distValue: { textAlign: 'center' },
    distTable: { padding: 12, borderRadius: 10, background: 'rgba(15, 10, 40, 0.3)', border: '1px solid rgba(124, 92, 252, 0.1)' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'center' },
    th: { padding: '6px 8px', color: 'var(--text-dim)', fontWeight: 700, borderBottom: '1px solid rgba(124, 92, 252, 0.1)' },
    td: { padding: '6px 8px', borderBottom: '1px solid rgba(124, 92, 252, 0.05)', fontFamily: 'monospace' },
    sliderGroup: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 },
    sliderRow: { display: 'flex', alignItems: 'center', gap: 10 },
    sliderLabel: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: 80 },
    sliderVal: { fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', minWidth: 60, textAlign: 'right', fontFamily: 'monospace' },
    memCard: { flex: 1, minWidth: 140, padding: 14, borderRadius: 10, border: '1px solid', background: 'rgba(15, 10, 40, 0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
    modelRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6, background: 'rgba(15, 10, 40, 0.3)' },
    theoryCard: { padding: 20, marginBottom: 20 },
    footer: { display: 'flex', justifyContent: 'center', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' },
};
