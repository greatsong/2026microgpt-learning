'use client';

import { useRouter } from 'next/navigation';

export default function Week15Intro() {
    const router = useRouter();

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>💻 15주차: 해커톤 시작!</h1>
                <p style={styles.subtitle}>
                    "배운 것을 세상에 보여줄 시간입니다."
                </p>

                {/* 브리지: 14주차 → 15주차 */}
                <div style={{
                    padding: '14px 18px', borderRadius: 12,
                    background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.15)',
                    marginBottom: 20, textAlign: 'left',
                    fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.7,
                }}>
                    <strong style={{ color: '#fbbf24' }}>🔗 여정을 돌아보면</strong><br/>
                    토큰화(1주차) → 확률 예측(2주차) → 임베딩(3주차) → 경사하강법(5주차)
                    → 뉴런(6주차) → 역전파(7주차) → RNN(8주차) → 어텐션(10주차)
                    → 정규화(12주차) → GPT 아키텍처(13주차) → RLHF(14주차)까지!
                    이제 이 모든 지식을 활용해 <strong>나만의 AI 프로젝트</strong>를 만들 시간입니다!
                </div>

                <div style={styles.section}>
                    <h3>🎯 목표: MVP (Minimum Viable Product)</h3>
                    <p>
                        2박 3일(혹은 정해진 기간) 동안 <strong>작동하는 최소한의 기능</strong>을 가진<br />
                        나만의 AI 서비스를 만들어보는 것이 목표입니다.
                    </p>
                </div>

                <div style={styles.section}>
                    <h3>🤝 규칙 (Rules)</h3>
                    <ul style={styles.list}>
                        <li>오픈소스 라이브러리 사용 환영! (바퀴를 다시 발명하지 마세요)</li>
                        <li>모르는 건 AI에게 물어보세요. (Co-pilot 적극 활용)</li>
                        <li>실패해도 괜찮습니다. 실패 과정이 가장 큰 배움입니다.</li>
                    </ul>
                </div>

                <button style={styles.button} onClick={() => router.push('/week15')}>
                    🔥 해커톤 입장하기
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
        fontSize: '2.5rem',
        fontWeight: 800,
        marginBottom: 10,
        background: 'linear-gradient(to right, #ec4899, #f43f5e)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        fontSize: '1.2rem',
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
        background: 'linear-gradient(to right, #ec4899, #f43f5e)',
        color: '#fff',
        border: 'none',
        padding: '16px 32px',
        fontSize: '1.1rem',
        fontWeight: 700,
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'transform 0.2s',
        boxShadow: '0 4px 6px -1px rgba(236, 72, 153, 0.5)',
        marginTop: 20,
    },
};
