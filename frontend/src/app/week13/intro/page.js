'use client';

import { useRouter } from 'next/navigation';

export default function WeekIntroPage() {
    const router = useRouter();

    return (
        <div style={styles.container}>
            <div style={styles.maxWidthWrapper}>
                <div style={styles.header}>
                    <div style={styles.badge}>13주차: GPT 아키텍처</div>
                    <h1 style={styles.title}>
                        <span style={{ fontSize: '3rem', marginRight: 15 }}>🏗️</span>
                        <span className="text-gradient">트랜스포머 블록</span>
                    </h1>
                    <p style={styles.subtitle}>
                        현대 AI의 가장 강력한 엔진, Decoder-Only Transformer를 해부합니다.
                    </p>
                </div>

                {/* 브리지: 12주차 → 13주차 */}
                <div style={{
                    padding: '14px 18px', borderRadius: 12,
                    background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.15)',
                    marginBottom: 20, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7,
                }}>
                    <strong style={{ color: '#fbbf24' }}>🔗 지난 시간 복습</strong><br/>
                    12주차에서 정규화로 숫자 폭발을 막는 법을 배웠어요.
                    이제 지금까지 배운 모든 조각 — <strong>임베딩, 어텐션, 정규화, FFN</strong> —을
                    하나로 조립할 시간입니다! 이것이 바로 <strong>GPT의 아키텍처</strong>예요.
                </div>

                <div style={styles.contentGrid}>
                    {/* 카드 1: GPT의 핵심 구조 */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>🏛️ GPT의 3단계 처리 과정</h2>
                        <div style={styles.steps}>
                            <div style={styles.stepItem}>
                                <div style={styles.stepIcon}>1️⃣</div>
                                <h3>입력 임베딩 (Input)</h3>
                                <p>텍스트를 벡터로 변환하고, 위치 정보(Positional Encoding)를 더해 순서를 기억하게 합니다.</p>
                            </div>
                            <div style={styles.stepItem}>
                                <div style={styles.stepIcon}>2️⃣</div>
                                <h3>N개의 트랜스포머 블록 (Blocks)</h3>
                                <p>GPT-3는 이 블록을 96개나 쌓았습니다! 각 블록에서 정보를 점점 더 깊이 있게 이해하고 추론합니다.</p>
                            </div>
                            <div style={styles.stepItem}>
                                <div style={styles.stepIcon}>3️⃣</div>
                                <h3>출력 헤드 (Output Head)</h3>
                                <p>최종 벡터를 다시 단어 확률(Logits)로 변환하여 다음 단어를 예측합니다.</p>
                            </div>
                        </div>
                    </div>

                    {/* 카드 2: 블록 내부 해부 */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>📦 트랜스포머 블록 내부</h2>
                        <div style={styles.grid2}>
                            <div style={styles.featureBox}>
                                <h3>👁️ Multi-Head Attention</h3>
                                <p>"이 단어가 문맥상 어디를 봐야 하는가?"를 계산합니다. 과거의 모든 정보를 조회하여 현재 단어의 의미를 풍부하게 만듭니다.</p>
                            </div>
                            <div style={styles.featureBox}>
                                <h3>🧠 Feed Forward Network</h3>
                                <p>각 토큰이 독립적으로 처리되는 신경망입니다. 모델이 학습한 '지식'이 저장되는 공간으로 여겨집니다.</p>
                            </div>
                            <div style={styles.featureBox}>
                                <h3>🛡️ Add & Norm</h3>
                                <p>잔차 연결(Residual Connection: 입력을 출력에 그대로 더해주는 &quot;지름길&quot;)과 정규화를 통해 깊은 신경망도 안정적으로 학습되게 합니다.</p>
                            </div>
                        </div>
                    </div>

                    {/* 카드 3: 왜 'Decoder-Only'인가? */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>🤔 왜 'Decoder-Only' 구조인가요?</h2>
                        <ul style={styles.list}>
                            <li>원래 Transformer는 기계 번역을 위해 Encoder(이해)와 Decoder(생성)가 모두 있었습니다.</li>
                            <li>하지만 <strong>"다음 단어 예측"</strong> 만으로도 충분히 언어를 이해할 수 있다는 것이 밝혀졌습니다 (GPT-1의 발견).</li>
                            <li>GPT는 오직 <strong>생성(Generation)</strong> 에 특화된 Decoder 부분만 떼어내어 엄청나게 크게 키운 모델입니다.</li>
                        </ul>
                    </div>
                </div>

                <button
                    className="btn-nova"
                    style={{ marginTop: 40, width: '100%', padding: '20px', fontSize: '1.2rem' }}
                    onClick={() => router.push('/week13')}
                >
                    🏗️ 아키텍처 조립하러 가기 (Lab)
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    maxWidthWrapper: {
        maxWidth: 1000,
        width: '100%',
    },
    header: {
        textAlign: 'center',
        marginBottom: 50,
    },
    badge: {
        display: 'inline-block',
        padding: '6px 16px',
        borderRadius: 20,
        fontSize: '0.9rem',
        fontWeight: 700,
        background: 'rgba(239, 68, 68, 0.2)',
        color: '#f87171',
        marginBottom: 15,
        border: '1px solid rgba(239, 68, 68, 0.3)',
    },
    title: {
        fontSize: '3rem',
        fontWeight: 800,
        marginBottom: 15,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    subtitle: {
        fontSize: '1.2rem',
        color: 'var(--text-secondary)',
    },
    contentGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: 25,
    },
    card: {
        background: 'rgba(15, 10, 40, 0.6)',
        borderRadius: 20,
        padding: 30,
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    cardTitle: {
        fontSize: '1.5rem',
        marginBottom: 20,
        color: '#fff',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: 10,
    },
    steps: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 20,
    },
    stepItem: {
        background: 'rgba(255,255,255,0.05)',
        padding: 20,
        borderRadius: 12,
        textAlign: 'center',
    },
    stepIcon: {
        fontSize: '2rem',
        marginBottom: 10,
    },
    grid2: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
    },
    featureBox: {
        background: 'rgba(255,255,255,0.05)',
        padding: 20,
        borderRadius: 12,
        borderLeft: '4px solid #60a5fa',
    },
    list: {
        paddingLeft: 20,
        lineHeight: 1.8,
        color: '#cbd5e1',
    }
};
