'use client';

import { useRouter } from 'next/navigation';

export default function WeekIntroPage() {
    const router = useRouter();

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <span style={{
                    ...styles.badge,
                    background: '#8b5cf620',
                    color: '#8b5cf6'
                }}>
                    14주차
                </span>

                <div style={{ fontSize: '4rem', margin: '20px 0' }}>🐕</div>

                <h1 style={styles.title}>
                    <span className="text-gradient">AI 조련하기 (SFT & RLHF)</span>
                </h1>

                <p style={styles.subtitle}>똑똑한 비서 만들기</p>

                {/* 브리지: 13주차 → 14주차 */}
                <div style={{
                    padding: '14px 18px', borderRadius: 12,
                    background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.15)',
                    marginBottom: 16, textAlign: 'left',
                    fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7,
                }}>
                    <strong style={{ color: '#fbbf24' }}>🔗 지난 시간 복습</strong><br/>
                    13주차에서 GPT의 아키텍처를 조립해봤어요. 하지만 이렇게 만든 모델은
                    &quot;다음 단어 예측&quot;만 잘할 뿐, 질문에 친절히 답하는 <strong>챗봇</strong>은 아니에요.
                    오늘은 이 &quot;똑똑하지만 예의 없는&quot; AI를 <strong>똑똑하고 예의 바른</strong> AI로 바꾸는 방법을 배웁니다!
                </div>

                {/* 동기 부여 */}
                <div style={{
                    padding: '14px 18px', borderRadius: 12,
                    background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.15)',
                    marginBottom: 20, textAlign: 'left',
                    fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7,
                }}>
                    <strong style={{ color: '#34d399' }}>💡 왜 &quot;조련&quot;이 필요한가요?</strong><br/>
                    GPT-4를 처음 학습시키면 인터넷의 모든 텍스트를 배운 상태예요.
                    유용한 지식도 있지만, 거짓 정보나 유해한 내용도 포함되어 있죠.
                    SFT와 RLHF는 이 &quot;야생의 AI&quot;를 안전하고 도움이 되는 비서로 길들이는 과정입니다!
                </div>

                <div style={styles.card}>
                    <div style={{ textAlign: 'left', marginBottom: 16 }}>
                        <h3 style={{ color: '#fff', marginBottom: 8 }}>학습 목표</h3>
                        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 1.8 }}>
                            <li>Pre-trained Model이 Chatbot으로 진화하는 과정 이해<br/>
                                <span style={{ fontSize: '0.83rem', color: 'var(--text-dim)' }}>
                                    — Pre-trained Model: 대량의 텍스트로 &quot;다음 단어 예측&quot;을 학습한 기본 모델
                                </span>
                            </li>
                            <li>SFT(Supervised Fine-Tuning): 모범 답안으로 미세 조정<br/>
                                <span style={{ fontSize: '0.83rem', color: 'var(--text-dim)' }}>
                                    — 사람이 작성한 좋은 대화 예시를 보여주며 따라하게 하는 것
                                </span>
                            </li>
                            <li>RLHF: 인간의 피드백으로 강화학습<br/>
                                <span style={{ fontSize: '0.83rem', color: 'var(--text-dim)' }}>
                                    — &quot;이 답변이 더 좋아!&quot;라고 사람이 평가하면, AI가 그 방향으로 학습
                                </span>
                            </li>
                        </ul>
                    </div>
                    <p style={{ lineHeight: 1.6, color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                        👇 아래 버튼을 눌러 직접 체험해보세요!<br />
                        AI에게 좋은 답변과 나쁜 답변을 가르치는 과정을 시뮬레이션 해보세요!
                    </p>
                </div>

                <button
                    className="btn-nova"
                    style={{ marginTop: 30, padding: '12px 30px' }}
                    onClick={() => router.push('/week14')}
                >
                    <span>🐕 RLHF 트레이닝 센터로 이동</span>
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        textAlign: 'center',
        maxWidth: 600,
    },
    badge: {
        padding: '6px 16px',
        borderRadius: 20,
        fontSize: '0.9rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
    },
    title: {
        fontSize: '2.5rem',
        fontWeight: 800,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: '1.2rem',
        color: 'var(--text-secondary)',
        marginBottom: 40,
    },
    card: {
        padding: 30,
        borderRadius: 20,
        background: 'rgba(15, 10, 40, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
};
