'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import WebGLErrorBoundary from '@/components/layout/WebGLErrorBoundary';
import Breadcrumb from '@/components/layout/Breadcrumb';
import useIsMobile from '@/lib/useIsMobile';
import { useClassStore } from '@/stores/useClassStore';
import { useRaceStore, TEAM_COLORS } from '@/stores/useRaceStore';
import { getSocket, connectSocket } from '@/lib/socket';
import { lossFunction, gradient as gradientFn } from '@/lib/lossFunction';

// Three.js SSR 미지원 → 동적 임포트
const GradientRaceScene = dynamic(
    () => import('@/components/3d/GradientRaceScene'),
    {
        ssr: false,
        loading: () => (
            <div style={loadingStyle}>
                <div style={loadingSpinner}>
                    <div className="animate-spin" style={{ fontSize: '2rem', lineHeight: 1 }}>🏔️</div>
                </div>
                <div className="animate-pulse-glow" style={loadingBox}>
                    손실 지형 로딩 중...
                </div>
            </div>
        ),
    }
);

export default function Week5Page() {
    const isMobile = useIsMobile();
    const studentName = useClassStore((s) => s.studentName);
    const schoolCode = useClassStore((s) => s.schoolCode);
    const roomCode = useClassStore((s) => s.roomCode);
    const addNotification = useClassStore((s) => s.addNotification);

    const racePhase = useRaceStore((s) => s.racePhase);
    const setRacePhase = useRaceStore((s) => s.setRacePhase);
    const teams = useRaceStore((s) => s.teams);
    const setTeams = useRaceStore((s) => s.setTeams);
    const balls = useRaceStore((s) => s.balls);
    const updateBalls = useRaceStore((s) => s.updateBalls);
    const myTeamId = useRaceStore((s) => s.myTeamId);
    const setMyTeamId = useRaceStore((s) => s.setMyTeamId);
    const myLearningRate = useRaceStore((s) => s.myLearningRate);
    const setMyLearningRate = useRaceStore((s) => s.setMyLearningRate);
    const myMomentum = useRaceStore((s) => s.myMomentum);
    const setMyMomentum = useRaceStore((s) => s.setMyMomentum);
    const results = useRaceStore((s) => s.results);
    const setResults = useRaceStore((s) => s.setResults);
    const reset = useRaceStore((s) => s.reset);

    const [isParamsSet, setIsParamsSet] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [isSoloMode, setIsSoloMode] = useState(false);
    const [showDeepDive, setShowDeepDive] = useState(false);
    const soloIntervalRef = useRef(null);

    // ── Socket 이벤트 ──
    useEffect(() => {
        const socket = getSocket();
        if (!socket.connected) connectSocket();

        const handleConnect = () => {
            if (roomCode) {
                socket.emit('join_class', {
                    studentName: studentName || '익명',
                    schoolCode: schoolCode || 'UNKNOWN',
                    roomCode,
                });
            }
        };

        if (socket.connected && roomCode) handleConnect();
        socket.on('connect', handleConnect);

        const handleTeamsUpdated = (data) => {
            setTeams(data.teams);
        };
        const handleRaceStarted = (data) => {
            setRacePhase('racing');
            updateBalls(data.balls);
        };
        const handleRaceTick = (data) => {
            updateBalls(data.balls);
        };
        const handleRaceAlert = (data) => {
            setAlerts((prev) => [
                { id: Date.now(), ...data },
                ...prev,
            ].slice(0, 10));
            addNotification(data.message);
        };
        const handleRaceFinished = (data) => {
            setRacePhase('finished');
            setResults(data.results);
        };
        const handleRaceReset = () => {
            reset();
            setIsParamsSet(false);
            setAlerts([]);
        };

        socket.on('race_teams_updated', handleTeamsUpdated);
        socket.on('race_started', handleRaceStarted);
        socket.on('race_tick', handleRaceTick);
        socket.on('race_alert', handleRaceAlert);
        socket.on('race_finished', handleRaceFinished);
        socket.on('race_reset', handleRaceReset);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('race_teams_updated', handleTeamsUpdated);
            socket.off('race_started', handleRaceStarted);
            socket.off('race_tick', handleRaceTick);
            socket.off('race_alert', handleRaceAlert);
            socket.off('race_finished', handleRaceFinished);
            socket.off('race_reset', handleRaceReset);
        };
    }, [roomCode]);

    // ── 파라미터 제출 ──
    const handleSubmitParams = useCallback(() => {
        const socket = getSocket();
        const teamId = socket.id;
        const colorIdx = Object.keys(teams).length % TEAM_COLORS.length;

        socket.emit('set_race_params', {
            teamId,
            teamName: studentName || '익명',
            color: TEAM_COLORS[colorIdx],
            learningRate: myLearningRate,
            momentum: myMomentum,
        });

        setMyTeamId(teamId);
        setIsParamsSet(true);
    }, [studentName, myLearningRate, myMomentum, teams]);

    // ── 혼자 연습 모드 ──
    const handleSoloPractice = useCallback(() => {
        setIsSoloMode(true);
        const myId = 'solo-me';
        const botId = 'solo-bot';

        // 팀 설정
        setTeams({
            [myId]: { id: myId, name: studentName || '나', color: TEAM_COLORS[0], learningRate: myLearningRate, momentum: myMomentum },
            [botId]: { id: botId, name: 'AI 봇 (lr=0.1, m=0.9)', color: TEAM_COLORS[3], learningRate: 0.1, momentum: 0.9 },
        });
        setMyTeamId(myId);

        // 랜덤 시작점 (높은 곳에서 시작하도록 반경 6~8 사이 랜덤)
        const angle = Math.random() * Math.PI * 2;
        const radius = 6 + Math.random() * 2; // 반경 6~8
        const startX = Math.cos(angle) * radius;
        const startZ = Math.sin(angle) * radius;

        const localBalls = {
            [myId]: { x: startX, z: startZ, y: 0, vx: 0, vz: 0, trail: [], status: 'racing', loss: 0, lr: myLearningRate, momentum: myMomentum },
            [botId]: { x: startX + 0.5, z: startZ + 0.5, y: 0, vx: 0, vz: 0, trail: [], status: 'racing', loss: 0, lr: 0.1, momentum: 0.9 },
        };
        localBalls[myId].y = lossFunction(localBalls[myId].x, localBalls[myId].z);
        localBalls[myId].loss = localBalls[myId].y;
        localBalls[botId].y = lossFunction(localBalls[botId].x, localBalls[botId].z);
        localBalls[botId].loss = localBalls[botId].y;

        updateBalls(localBalls);
        setRacePhase('racing');
        setIsParamsSet(true);

        // 로컬 물리 시뮬레이션 (30fps)
        if (soloIntervalRef.current) clearInterval(soloIntervalRef.current);
        soloIntervalRef.current = setInterval(() => {
            let allDone = true;

            for (const [teamId, ball] of Object.entries(localBalls)) {
                if (ball.status !== 'racing') continue;
                allDone = false;

                const grad = gradientFn(ball.x, ball.z);
                ball.vx = ball.momentum * ball.vx - ball.lr * grad.gx;
                ball.vz = ball.momentum * ball.vz - ball.lr * grad.gz;
                ball.x += ball.vx;
                ball.z += ball.vz;
                ball.y = lossFunction(ball.x, ball.z);
                ball.loss = ball.y;
                ball.trail.push({ x: ball.x, y: ball.y, z: ball.z });
                if (ball.trail.length > 200) ball.trail.shift();

                // 이탈 판정
                if (Math.abs(ball.x) > 12 || Math.abs(ball.z) > 12 || ball.y > 10) {
                    ball.status = 'escaped';
                }
                // 수렴 판정
                const speed = Math.sqrt(ball.vx * ball.vx + ball.vz * ball.vz);
                if (speed < 0.001 && ball.trail.length > 30) {
                    ball.status = 'converged';
                }
            }

            updateBalls({ ...localBalls });

            if (allDone) {
                clearInterval(soloIntervalRef.current);
                setRacePhase('finished');
                const res = Object.entries(localBalls).map(([id, b]) => ({
                    teamId: id,
                    teamName: id === myId ? (studentName || '나') : 'AI 봇',
                    finalLoss: b.loss,
                    status: b.status,
                }));
                setResults(res);
            }
        }, 33);
    }, [studentName, myLearningRate, myMomentum]);

    // cleanup
    useEffect(() => {
        return () => { if (soloIntervalRef.current) clearInterval(soloIntervalRef.current); };
    }, []);

    const teamCount = Object.keys(teams).length;
    const myBall = balls[myTeamId];

    return (
        <div style={{
            ...styles.container,
            ...(isMobile ? { flexDirection: 'column', height: 'auto', minHeight: '100vh', overflow: 'auto' } : {}),
        }}>
            {/* ── 모바일: 3D 캔버스 상단 ── */}
            {isMobile && (
                <div style={{ width: '100%', height: 300, position: 'relative', flexShrink: 0 }}>
                    <WebGLErrorBoundary fallbackProps={{
                        weekTitle: '3D 경사하강법 레이싱',
                        conceptSummary: '경사하강법(Gradient Descent)은 손실 함수의 최저점을 찾아가는 최적화 알고리즘입니다. 학습률이 크면 빠르지만 발산 위험이 있고, 작으면 안전하지만 느립니다.',
                    }}>
                        <GradientRaceScene />
                    </WebGLErrorBoundary>
                    <div style={styles.canvasOverlay}>
                        <span className="badge-glow" style={{ fontSize: '0.75rem' }}>
                            🏔️ 터치로 탐색
                        </span>
                    </div>
                </div>
            )}

            {/* ── 좌측 패널 ── */}
            <div style={{
                ...styles.leftPanel,
                ...(isMobile ? { width: '100%', minWidth: 0, height: 'auto', borderRight: 'none', borderTop: '1px solid var(--border-subtle)' } : {}),
            }}>
                {/* 빵크럼 */}
                <Breadcrumb
                    items={[{ label: '5주차 인트로', href: '/week5/intro' }]}
                    current="경사하강법 레이싱"
                />

                {/* 헤더 */}
                <div style={styles.header}>
                    <h2 style={styles.weekTitle}>5주차</h2>
                    <h1 style={styles.moduleTitle}>
                        <span className="text-gradient">경사하강법 레이싱</span>
                    </h1>
                    <p style={styles.description}>
                        학습률과 모멘텀을 조절해 손실 지형의
                        <br />
                        <strong>최저점</strong>에 가장 먼저 도달하세요! 🏎️💨
                    </p>
                </div>

                {/* 접속 현황 */}
                <div className="glass-card" style={styles.statusCard}>
                    <div style={styles.statusRow}>
                        <span className="badge-glow online">
                            {racePhase === 'racing' ? '🏁 레이싱' : racePhase === 'finished' ? '🏆 완료' : '⏳ 대기'}
                        </span>
                        <span style={styles.statusText}>
                            {teamCount}팀 참가
                        </span>
                    </div>
                </div>

                {/* 파라미터 설정 */}
                {racePhase === 'setup' && !isParamsSet && (
                    <div className="glass-card" style={styles.inputCard}>
                        <label className="label-cosmic">🎛️ 하이퍼파라미터 설정</label>

                        {/* 프리셋 버튼 */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {[
                                { label: '🛡️ 안전', lr: 0.05, m: 0.9, color: '#10b981' },
                                { label: '⚖️ 균형', lr: 0.1, m: 0.8, color: '#3b82f6' },
                                { label: '🚀 빠름', lr: 0.5, m: 0.5, color: '#f59e0b' },
                                { label: '💥 위험', lr: 1.2, m: 0.3, color: '#f43f5e' },
                            ].map(p => (
                                <button key={p.label} onClick={() => { setMyLearningRate(p.lr); setMyMomentum(p.m); }}
                                    style={{
                                        flex: 1, minWidth: 70, padding: '6px 8px', borderRadius: 8,
                                        border: `1px solid ${p.color}44`, background: `${p.color}15`,
                                        color: p.color, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                                    }}>
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        <div style={styles.paramRow}>
                            <span style={styles.paramLabel}>학습률 (Learning Rate)</span>
                            <input
                                type="range"
                                className="slider-cosmic"
                                min={0.01}
                                max={1.5}
                                step={0.01}
                                value={myLearningRate}
                                onChange={(e) => setMyLearningRate(parseFloat(e.target.value))}
                            />
                            <span style={styles.paramValue}>{myLearningRate.toFixed(2)}</span>
                        </div>
                        {myLearningRate > 0.8 ? (
                            <div style={{
                                padding: '8px 12px', borderRadius: 8,
                                background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)',
                                fontSize: '0.78rem', color: '#f43f5e', fontWeight: 600,
                                animation: myLearningRate > 1.0 ? 'pulseGlow 1s infinite' : 'none',
                            }}>
                                {myLearningRate > 1.0
                                    ? '🔥 극도로 높음! 거의 확실히 발산(diverge)합니다!'
                                    : '⚠️ 위험 구간! 손실이 폭발할 수 있어요.'}
                                <div style={{ fontSize: '0.72rem', color: '#fb7185', marginTop: 4 }}>
                                    발산 = 최적점에서 점점 멀어져 Loss가 무한대로 ↑
                                </div>
                            </div>
                        ) : (
                            <p style={styles.paramHint}>
                                {myLearningRate < 0.05
                                    ? '🐌 너무 작으면 늦게 도착해요...'
                                    : '✅ 적당한 범위입니다'}
                            </p>
                        )}

                        <div style={styles.paramRow}>
                            <span style={styles.paramLabel}>모멘텀 (Momentum)</span>
                            <input
                                type="range"
                                className="slider-cosmic"
                                min={0}
                                max={0.99}
                                step={0.01}
                                value={myMomentum}
                                onChange={(e) => setMyMomentum(parseFloat(e.target.value))}
                            />
                            <span style={styles.paramValue}>{myMomentum.toFixed(2)}</span>
                        </div>
                        <p style={styles.paramHint}>
                            모멘텀은 관성! 높으면 지역 최솟값을 탈출할 수 있어요.
                        </p>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                className="btn-nova"
                                style={{ ...styles.submitBtn, flex: 1 }}
                                onClick={handleSoloPractice}
                            >
                                🎮 혼자 연습
                            </button>
                            {roomCode && (
                                <button
                                    className="btn-nova"
                                    style={{ ...styles.submitBtn, flex: 1 }}
                                    onClick={handleSubmitParams}
                                >
                                    🏎️ 수업 참가
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* 파라미터 확정 후 대기 */}
                {racePhase === 'setup' && isParamsSet && (
                    <div className="glass-card" style={styles.waitCard}>
                        <div style={styles.waitIcon}>🏎️</div>
                        <p style={styles.waitText}>
                            파라미터 세팅 완료!<br />
                            선생님이 레이스를 시작하면 출발합니다.
                        </p>
                        <div style={styles.myParams}>
                            <span>학습률: <strong>{myLearningRate.toFixed(2)}</strong></span>
                            <span>모멘텀: <strong>{myMomentum.toFixed(2)}</strong></span>
                        </div>
                    </div>
                )}

                {/* 레이싱 중: 실시간 데이터 + Loss 차트 */}
                {racePhase === 'racing' && myBall && (
                    <div className="glass-card" style={styles.liveCard}>
                        <label className="label-cosmic">📊 실시간 현황</label>
                        <div style={styles.liveGrid}>
                            <div style={styles.liveItem}>
                                <span style={styles.liveLabel}>현재 Loss</span>
                                <span style={{
                                    ...styles.liveValue,
                                    color: myBall.loss > 5 ? '#f43f5e' : myBall.loss > 2 ? '#fbbf24' : '#10b981',
                                }}>{myBall.loss?.toFixed(4)}</span>
                            </div>
                            <div style={styles.liveItem}>
                                <span style={styles.liveLabel}>위치 (X, Z)</span>
                                <span style={styles.liveValue}>
                                    ({myBall.x?.toFixed(2)}, {myBall.z?.toFixed(2)})
                                </span>
                            </div>
                            <div style={styles.liveItem}>
                                <span style={styles.liveLabel}>상태</span>
                                <span style={{
                                    ...styles.liveValue,
                                    color: myBall.status === 'escaped' ? '#f43f5e' :
                                        myBall.status === 'converged' ? '#10b981' : '#fbbf24',
                                }}>
                                    {myBall.status === 'escaped' ? '💥 발산! (이탈)' :
                                        myBall.status === 'converged' ? '🏁 수렴!' : '🏎️ 질주 중'}
                                </span>
                            </div>
                        </div>

                        {/* 미니 Loss 차트 */}
                        {myBall.trail && myBall.trail.length > 2 && (
                            <div style={{ marginTop: 10 }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: 4 }}>Loss 히스토리</div>
                                <div style={{
                                    height: 60, borderRadius: 6, background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(124,92,252,0.1)', overflow: 'hidden',
                                    display: 'flex', alignItems: 'flex-end', padding: '2px 1px',
                                }}>
                                    {myBall.trail.slice(-50).map((p, i, arr) => {
                                        const maxLoss = Math.max(...arr.map(t => t.y), 1);
                                        const h = Math.min(100, Math.max(2, (p.y / maxLoss) * 100));
                                        return (
                                            <div key={i} style={{
                                                flex: 1, minWidth: 2, height: `${h}%`,
                                                background: i === arr.length - 1 ? '#fbbf24' :
                                                    p.y > 3 ? 'rgba(244,63,94,0.6)' : 'rgba(16,185,129,0.5)',
                                                borderRadius: '2px 2px 0 0',
                                                transition: 'height 0.1s',
                                            }} />
                                        );
                                    })}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: 2 }}>
                                    <span>← 과거</span>
                                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>현재: {myBall.loss?.toFixed(3)}</span>
                                </div>
                            </div>
                        )}

                        {myBall.status === 'escaped' && (
                            <div style={{
                                marginTop: 8, padding: '8px 12px', borderRadius: 8,
                                background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)',
                                fontSize: '0.78rem', color: '#f43f5e', textAlign: 'center',
                            }}>
                                💥 학습률이 너무 커서 발산했습니다!<br />
                                <span style={{ fontSize: '0.72rem', color: '#fb7185' }}>더 작은 학습률로 다시 시도해보세요.</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 결과 */}
                {racePhase === 'finished' && results.length > 0 && (
                    <div className="glass-card" style={styles.resultCard}>
                        <label className="label-cosmic">🏆 레이스 결과</label>
                        <div style={styles.resultList}>
                            {results.map((r) => (
                                <div key={r.teamId} style={{
                                    ...styles.resultItem,
                                    ...(r.teamId === myTeamId ? styles.resultItemMine : {}),
                                }}>
                                    <span style={styles.resultRank}>
                                        {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}
                                    </span>
                                    <span style={styles.resultName}>{r.teamName}</span>
                                    <span style={{
                                        ...styles.resultLoss,
                                        color: r.status === 'escaped' ? '#f43f5e' : '#10b981',
                                    }}>
                                        {r.status === 'escaped' ? '이탈' : `Loss: ${r.finalLoss?.toFixed(3)}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 알림/경고 */}
                {alerts.length > 0 && (
                    <div className="glass-card" style={styles.alertCard}>
                        <label className="label-cosmic">⚡ 알림</label>
                        {alerts.slice(0, 5).map((a) => (
                            <div key={a.id} style={styles.alertItem}>
                                {a.message}
                            </div>
                        ))}
                    </div>
                )}

                {/* 팀 목록 */}
                <div className="glass-card" style={styles.teamList}>
                    <label className="label-cosmic">🏎️ 참가 팀</label>
                    <div style={styles.teamScroll}>
                        {Object.entries(teams).map(([id, team]) => (
                            <div key={id} style={styles.teamItem}>
                                <div style={{ ...styles.teamDot, background: team.color }} />
                                <span style={styles.teamNameText}>{team.name}</span>
                                <span style={styles.teamParams}>
                                    lr:{team.learningRate} m:{team.momentum}
                                </span>
                            </div>
                        ))}
                        {teamCount === 0 && (
                            <p style={styles.emptyText}>
                                아직 참가한 팀이 없어요...
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Theory Section ── */}
                <div className="glass-card" style={styles.card}>
                    <label className="label-cosmic">🤖 LLM 학습의 비밀</label>
                    <div style={{ ...styles.description, fontSize: '0.85rem' }}>
                        <div style={{
                            padding: '10px 14px', borderRadius: 8,
                            background: 'rgba(52, 211, 153, 0.08)',
                            border: '1px solid rgba(52, 211, 153, 0.15)',
                            marginBottom: 12, fontSize: '0.82rem',
                            color: 'var(--text-secondary)', lineHeight: 1.6,
                        }}>
                            💡 <strong style={{ color: '#34d399' }}>Loss(손실) 함수란?</strong> —
                            AI의 예측이 정답과 얼마나 다른지를 숫자로 나타낸 것.
                            Loss가 <strong>0에 가까울수록</strong> 정확한 예측이에요.
                            경사하강법의 목표는 이 Loss를 최소화하는 것!
                        </div>
                        <p style={{ marginBottom: 10 }}>
                            <strong>1. 천문학적인 비용 (GPU)</strong><br />
                            GPT-4를 학습시킬 때는 이 경사하강법을 <strong>수천 대의 GPU</strong>에서 동시에 돌립니다.
                            전기세만 수백억 원이 나오는데, 그 이유가 바로 이 &quot;최저점 찾기&quot;를 엄청나게 많이 반복해야 하기 때문입니다.
                        </p>
                        <p style={{ marginBottom: 10 }}>
                            <strong>2. 학습률(Learning Rate) 스케줄링</strong><br />
                            처음엔 과감하게(Step을 크게) 내려가다가, 최저점에 가까워지면 아주 조심스럽게(Step을 작게) 이동합니다.
                            이것을 <strong>&quot;Learning Rate Scheduler&quot;</strong>라고 부릅니다.
                        </p>
                        <p style={{ marginBottom: 10 }}>
                            <strong>3. 옵티마이저(Optimizer) 비교</strong>
                        </p>
                        <div style={{
                            borderRadius: 8, overflow: 'hidden',
                            border: '1px solid rgba(124,92,252,0.15)', fontSize: '0.8rem',
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr', background: 'rgba(124,92,252,0.08)' }}>
                                <div style={{ padding: '6px 10px', fontWeight: 700, color: 'var(--text-secondary)' }}>옵티마이저</div>
                                <div style={{ padding: '6px 10px', fontWeight: 700, color: 'var(--text-secondary)' }}>특징</div>
                                <div style={{ padding: '6px 10px', fontWeight: 700, color: 'var(--text-secondary)' }}>사용처</div>
                            </div>
                            {[
                                { name: 'SGD', feat: '기본 경사하강. 모멘텀 추가 가능', use: '간단한 모델, 연구', color: '#94a3b8' },
                                { name: 'Adam', feat: '학습률 자동 조절 + 모멘텀', use: 'GPT, BERT 등 LLM', color: '#10b981' },
                                { name: 'AdaGrad', feat: '자주 나오는 파라미터의 lr 감소', use: '희소 데이터 (NLP)', color: '#3b82f6' },
                                { name: 'AdamW', feat: 'Adam + 가중치 감쇠(Weight Decay)', use: 'GPT-3, LLaMA', color: '#a78bfa' },
                            ].map(o => (
                                <div key={o.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ padding: '6px 10px', color: o.color, fontWeight: 700 }}>{o.name}</div>
                                    <div style={{ padding: '6px 10px', color: 'var(--text-dim)' }}>{o.feat}</div>
                                    <div style={{ padding: '6px 10px', color: 'var(--text-dim)' }}>{o.use}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{
                            marginTop: 10, padding: 10, borderRadius: 8,
                            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                            fontSize: '0.8rem', color: 'var(--text-secondary)',
                        }}>
                            💡 <strong>실전 팁:</strong> 대부분의 LLM 학습에는 <strong style={{ color: '#10b981' }}>AdamW</strong>가 사용됩니다.
                            이 게임에서 사용한 SGD+Momentum을 기반으로 학습률 자동 조절이 추가된 것입니다.
                        </div>
                    </div>
                </div>

                {/* 한 걸음 더: Loss 함수의 종류 */}
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
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        {showDeepDive ? '▼' : '▶'} 한 걸음 더: Loss 함수는 어떤 종류가 있을까?
                    </button>
                    {showDeepDive && (
                        <div style={{
                            padding: 14,
                            background: 'rgba(124, 92, 252, 0.04)',
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.7,
                            textAlign: 'left',
                        }}>
                            <p style={{ marginBottom: 8 }}>
                                <strong style={{ color: '#fbbf24' }}>Cross-Entropy Loss</strong> —
                                GPT가 사용하는 Loss 함수! 모델이 예측한 확률 분포와 정답 사이의 차이를 측정해요.
                                2주차에서 배운 Softmax 확률이 여기서 쓰입니다.
                            </p>
                            <p style={{ marginBottom: 8 }}>
                                <strong style={{ color: '#34d399' }}>MSE (Mean Squared Error)</strong> —
                                예측값과 정답의 차이를 제곱해서 평균 낸 것. 숫자 예측(회귀) 문제에 많이 써요.
                            </p>
                            <p>
                                <strong style={{ color: '#f87171' }}>핵심 포인트</strong> —
                                어떤 Loss를 선택하느냐에 따라 AI가 &quot;무엇을 잘하려고 노력하는지&quot;가 달라져요.
                                Loss 함수는 AI에게 주는 <strong>성적표</strong>와 같습니다!
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── 우측: 3D 캔버스 (데스크톱만) ── */}
            {!isMobile && (
                <div style={styles.canvasWrapper}>
                    <WebGLErrorBoundary fallbackProps={{
                        weekTitle: '3D 경사하강법 레이싱',
                        conceptSummary: '경사하강법(Gradient Descent)은 손실 함수의 최저점을 찾아가는 최적화 알고리즘입니다. 학습률이 크면 빠르지만 발산 위험이 있고, 작으면 안전하지만 느립니다. 모멘텀은 관성을 더해 지역 최솟값을 탈출하는 데 도움을 줍니다.',
                    }}>
                        <GradientRaceScene />
                    </WebGLErrorBoundary>

                    <div style={styles.canvasOverlay}>
                        <span className="badge-glow" style={{ fontSize: '0.8rem' }}>
                            🏔️ 손실 지형 · 마우스로 드래그하여 탐색
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

const loadingStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    background: 'var(--bg-void)',
};

const loadingSpinner = {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'rgba(124, 92, 252, 0.1)',
    border: '2px solid rgba(124, 92, 252, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const loadingBox = {
    padding: '8px 24px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '1.1rem',
};

const styles = {
    container: {
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
    },
    leftPanel: {
        width: 380,
        minWidth: 380,
        height: '100%',
        overflowY: 'auto',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        borderRight: '1px solid var(--border-subtle)',
    },
    header: { marginBottom: 4 },
    weekTitle: {
        fontSize: '0.85rem',
        color: '#f43f5e',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    moduleTitle: { fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 },
    description: {
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
    },
    statusCard: { padding: 14 },
    statusRow: { display: 'flex', alignItems: 'center', gap: 12 },
    statusText: { fontSize: '0.85rem', color: 'var(--text-secondary)' },
    inputCard: {
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    paramRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    paramLabel: {
        fontSize: '0.82rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        minWidth: 140,
    },
    paramValue: {
        fontSize: '0.85rem',
        fontWeight: 700,
        color: 'var(--accent-star-cyan)',
        minWidth: 45,
        textAlign: 'right',
        fontFamily: 'monospace',
    },
    paramHint: {
        fontSize: '0.78rem',
        color: 'var(--text-dim)',
        lineHeight: 1.4,
        marginTop: -4,
    },
    submitBtn: { marginTop: 8, width: '100%' },
    waitCard: {
        padding: 24,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
    },
    waitIcon: { fontSize: '2.5rem' },
    waitText: {
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
    },
    myParams: {
        display: 'flex',
        gap: 16,
        fontSize: '0.85rem',
        color: 'var(--text-primary)',
    },
    liveCard: {
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    liveGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
    liveItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    liveLabel: { fontSize: '0.82rem', color: 'var(--text-dim)' },
    liveValue: {
        fontSize: '0.9rem',
        fontWeight: 700,
        fontFamily: 'monospace',
        color: 'var(--text-primary)',
    },
    resultCard: { padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
    resultList: { display: 'flex', flexDirection: 'column', gap: 6 },
    resultItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(124, 92, 252, 0.05)',
    },
    resultItemMine: {
        background: 'rgba(251, 191, 36, 0.1)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
    },
    resultRank: { fontSize: '1.2rem', minWidth: 30 },
    resultName: { fontSize: '0.85rem', fontWeight: 600, flex: 1 },
    resultLoss: { fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' },
    alertCard: { padding: 12, display: 'flex', flexDirection: 'column', gap: 6 },
    alertItem: {
        fontSize: '0.8rem',
        color: '#f43f5e',
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(244, 63, 94, 0.1)',
    },
    teamList: {
        padding: 16,
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
    },
    teamScroll: {
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginTop: 8,
    },
    teamItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(124, 92, 252, 0.05)',
    },
    teamDot: {
        width: 10,
        height: 10,
        borderRadius: '50%',
        flexShrink: 0,
    },
    teamNameText: {
        fontSize: '0.82rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
        flex: 1,
    },
    teamParams: {
        fontSize: '0.72rem',
        color: 'var(--text-dim)',
        fontFamily: 'monospace',
    },
    emptyText: {
        fontSize: '0.82rem',
        color: 'var(--text-dim)',
        textAlign: 'center',
        padding: 20,
    },
    canvasWrapper: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    canvasOverlay: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
};
