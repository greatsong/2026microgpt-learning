'use client';

import { useRouter } from 'next/navigation';

export default function Week12Intro() {
    const router = useRouter();

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>⚡ 12주차: 폭발을 막아라! (RMSNorm)</h1>
                <p style={styles.subtitle}>
                    "숫자가 너무 커지면 AI가 고장납니다. 어떻게 해야 할까요?"
                </p>

                {/* 브리지: 10주차 → 12주차 */}
                <div style={{
                    padding: '14px 18px', borderRadius: 12,
                    background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.15)',
                    marginBottom: 20, textAlign: 'left',
                    fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.7,
                }}>
                    <strong style={{ color: '#fbbf24' }}>🔗 지난 시간 복습</strong><br/>
                    10주차에서 <strong>어텐션</strong>이 문맥을 이해하는 핵심임을 배웠어요.
                    하지만 Transformer 블록을 수십 개 쌓으면 숫자가 폭발하거나 사라지는 문제가 생깁니다.
                    오늘은 이 문제를 해결하는 <strong>정규화(Normalization)</strong>를 배워봐요!
                </div>

                <div style={styles.section}>
                    <h3>📈 문제 상황: 기울기 폭발 (Gradient Explosion)</h3>
                    <p>
                        AI가 학습하면서 숫자를 계속 더하다 보면, 값이 <strong>무한대</strong>로 커지거나(<strong>기울기 폭발</strong>),<br />
                        반대로 아주 작게 줄어들어 사라지는(<strong>기울기 소실</strong>) 문제가 발생합니다.<br/>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                            비유하면, 전화 게임처럼 말이 전달될수록 원래 의미가 변하거나 사라지는 것과 비슷해요!
                        </span>
                    </p>
                </div>

                <div style={styles.section}>
                    <h3>🛡️ 해결책: 정규화 (Normalization)</h3>
                    <p>
                        데이터를 강제로 <strong>일정한 범위</strong> 안으로 꾹꾹 눌러 담습니다.<br />
                        마치 학생들의 점수를 0~100점으로 환산하는 것과 비슷해요!
                    </p>
                    <ul style={styles.list}>
                        <li>특히 <strong>RMSNorm</strong>은 평균을 빼지 않고 크기만 조절해서 <strong>계산이 빠르고 효과적</strong>입니다! (LLaMA 등 최신 AI 사용)</li>
                    </ul>
                </div>

                <button style={styles.button} onClick={() => router.push('/week12')}>
                    🧪 정규화 실험실 입장
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)',
    },
    card: {
        maxWidth: 600,
        width: '100%',
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: 24,
        padding: 40,
        border: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    title: {
        fontSize: '1.8rem',
        fontWeight: 800,
        marginBottom: 10,
        background: 'linear-gradient(to right, #f59e0b, #d97706)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        fontSize: '1.1rem',
        color: '#94a3b8',
        marginBottom: 40,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: 30,
        textAlign: 'left',
        background: 'rgba(255,255,255,0.03)',
        padding: 20,
        borderRadius: 12,
    },
    list: {
        marginTop: 10,
        paddingLeft: 20,
        color: '#cbd5e1',
        lineHeight: 1.6,
    },
    button: {
        background: 'linear-gradient(to right, #f59e0b, #d97706)',
        color: '#fff',
        border: 'none',
        padding: '16px 32px',
        fontSize: '1.1rem',
        fontWeight: 700,
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'transform 0.2s',
        boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.5)',
        marginTop: 20,
    },
};
