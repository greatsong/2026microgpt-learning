'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import WebGLErrorBoundary from '@/components/layout/WebGLErrorBoundary';
import useIsMobile from '@/lib/useIsMobile';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { useClassStore } from '@/stores/useClassStore';
import { useGalaxyStore } from '@/stores/useGalaxyStore';
import { getSocket, connectSocket } from '@/lib/socket';

// ── 사전 정의된 예시 단어 세트 ──
const PRESET_WORDS = {
    '동물': [
        { word: '고양이', pos: { x: 3, y: 2, z: 1 } },
        { word: '강아지', pos: { x: 3.5, y: 2.3, z: 0.8 } },
        { word: '금붕어', pos: { x: 2.5, y: 1.5, z: 1.5 } },
    ],
    '음식': [
        { word: '피자', pos: { x: -3, y: 1, z: 2 } },
        { word: '햄버거', pos: { x: -2.5, y: 1.3, z: 2.2 } },
        { word: '초밥', pos: { x: -2, y: 0.8, z: 1.5 } },
    ],
    '감정': [
        { word: '기쁨', pos: { x: 1, y: 5, z: -1 } },
        { word: '슬픔', pos: { x: -1, y: -4, z: 1 } },
        { word: '분노', pos: { x: -2, y: -3, z: 2 } },
    ],
};

// ── 벡터 연산 체험 컴포넌트 ──
function VectorArithmeticPanel() {
    const WORD_VECTORS = {
        '왕': [0.8, 0.6, 0.3],
        '여왕': [0.75, 0.65, 0.7],
        '남자': [0.3, 0.1, -0.2],
        '여자': [0.25, 0.15, 0.2],
        '아들': [0.5, 0.3, -0.1],
        '딸': [0.45, 0.35, 0.3],
        '한국': [0.1, 0.9, 0.4],
        '서울': [0.15, 0.85, 0.6],
        '일본': [0.2, 0.8, 0.35],
        '도쿄': [0.25, 0.75, 0.55],
    };

    const [wordA, setWordA] = useState('왕');
    const [wordB, setWordB] = useState('남자');
    const [wordC, setWordC] = useState('여자');

    const vecA = WORD_VECTORS[wordA];
    const vecB = WORD_VECTORS[wordB];
    const vecC = WORD_VECTORS[wordC];

    const resultVec = vecA.map((v, i) => v - vecB[i] + vecC[i]);

    const cosSim = (a, b) => {
        const dot = a.reduce((s, v, i) => s + v * b[i], 0);
        const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
        const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
        if (magA === 0 || magB === 0) return 0;
        return dot / (magA * magB);
    };

    const rankings = Object.entries(WORD_VECTORS)
        .filter(([w]) => w !== wordA && w !== wordB && w !== wordC)
        .map(([word, vec]) => ({ word, sim: cosSim(resultVec, vec) }))
        .sort((a, b) => b.sim - a.sim);

    const bestMatch = rankings[0];
    const words = Object.keys(WORD_VECTORS);

    return (
        <div style={simStyles.funFact}>
            <strong>🧮 벡터 연산 체험</strong>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4, marginBottom: 10 }}>
                단어 벡터의 빼기/더하기로 의미를 조합해보세요!
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 10 }}>
                <select className="select-cosmic" style={{ fontSize: '0.8rem', padding: '6px 8px', width: 70 }}
                    value={wordA} onChange={(e) => setWordA(e.target.value)}>
                    {words.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <span style={{ fontWeight: 800, color: '#f43f5e', fontSize: '1.1rem' }}>−</span>
                <select className="select-cosmic" style={{ fontSize: '0.8rem', padding: '6px 8px', width: 70 }}
                    value={wordB} onChange={(e) => setWordB(e.target.value)}>
                    {words.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>+</span>
                <select className="select-cosmic" style={{ fontSize: '0.8rem', padding: '6px 8px', width: 70 }}
                    value={wordC} onChange={(e) => setWordC(e.target.value)}>
                    {words.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
            </div>

            <div style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 8,
                background: 'rgba(124, 92, 252, 0.08)', border: '1px solid rgba(124, 92, 252, 0.15)',
                textAlign: 'center',
            }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: 4 }}>연산 결과 벡터</div>
                <code style={{ fontSize: '0.78rem', color: '#a78bfa', fontWeight: 600 }}>
                    [{resultVec.map(v => v.toFixed(2)).join(', ')}]
                </code>
            </div>

            {bestMatch && (
                <div style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: 2 }}>가장 가까운 단어</div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{bestMatch.word}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 6 }}>
                        (유사도 {Math.round(bestMatch.sim * 100)}%)
                    </span>
                    <div style={{ marginTop: 6, fontSize: '0.78rem', color: '#fbbf24' }}>
                        {wordA} − {wordB} + {wordC} ≈ <strong>{bestMatch.word}</strong>
                    </div>
                </div>
            )}

            <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 4 }}>후보 단어 유사도 순위:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {rankings.slice(0, 5).map((r, i) => (
                        <span key={r.word} style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem',
                            background: i === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(124,92,252,0.06)',
                            color: i === 0 ? '#10b981' : 'var(--text-dim)',
                            fontWeight: i === 0 ? 700 : 400,
                        }}>
                            {r.word} {Math.round(r.sim * 100)}%
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── 코사인 유사도 계산기 컴포넌트 ──
function CosineSimilarityPanel({ stars }) {
    const starEntries = Object.entries(stars);
    const allWords = [
        ...starEntries.map(([id, s]) => ({ id, word: s.word, pos: s.position })),
        ...Object.values(PRESET_WORDS).flat().map((w, i) => ({ id: `preset-${i}`, word: w.word, pos: w.pos })),
    ];

    const [wordAId, setWordAId] = useState(null);
    const [wordBId, setWordBId] = useState(null);

    const wordA = allWords.find(w => w.id === wordAId);
    const wordB = allWords.find(w => w.id === wordBId);

    const cosineSim = (a, b) => {
        if (!a || !b) return null;
        const dot = a.x * b.x + a.y * b.y + a.z * b.z;
        const magA = Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2);
        const magB = Math.sqrt(b.x ** 2 + b.y ** 2 + b.z ** 2);
        if (magA === 0 || magB === 0) return 0;
        return dot / (magA * magB);
    };

    const eucDist = (a, b) => {
        if (!a || !b) return null;
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
    };

    const sim = wordA && wordB ? cosineSim(wordA.pos, wordB.pos) : null;
    const dist = wordA && wordB ? eucDist(wordA.pos, wordB.pos) : null;
    const angleDeg = sim !== null ? (Math.acos(Math.max(-1, Math.min(1, sim))) * 180 / Math.PI) : null;

    if (allWords.length < 2) return null;

    return (
        <div className="glass-card" style={simStyles.panel}>
            <label className="label-cosmic">📐 코사인 유사도 계산기</label>
            <p style={simStyles.hint}>두 단어를 선택하면 유사도, 거리, 각도를 계산합니다!</p>

            <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                    <div style={simStyles.selectLabel}>단어 A</div>
                    <select className="select-cosmic" style={{ fontSize: '0.85rem', padding: '8px 10px' }}
                        value={wordAId || ''} onChange={(e) => setWordAId(e.target.value || null)}>
                        <option value="">선택...</option>
                        {allWords.map(w => (
                            <option key={w.id} value={w.id}>{w.word}</option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={simStyles.selectLabel}>단어 B</div>
                    <select className="select-cosmic" style={{ fontSize: '0.85rem', padding: '8px 10px' }}
                        value={wordBId || ''} onChange={(e) => setWordBId(e.target.value || null)}>
                        <option value="">선택...</option>
                        {allWords.filter(w => w.id !== wordAId).map(w => (
                            <option key={w.id} value={w.id}>{w.word}</option>
                        ))}
                    </select>
                </div>
            </div>

            {sim !== null && (
                <div style={simStyles.resultBox}>
                    <div style={simStyles.resultRow}>
                        <span style={{ color: 'var(--text-dim)' }}>코사인 유사도:</span>
                        <span style={{
                            fontWeight: 800, fontSize: '1.1rem',
                            color: sim > 0.8 ? '#10b981' : sim > 0.3 ? '#fbbf24' : '#f43f5e'
                        }}>
                            {sim.toFixed(3)}
                        </span>
                    </div>
                    <div style={simStyles.resultRow}>
                        <span style={{ color: 'var(--text-dim)' }}>각도:</span>
                        <span style={{ fontWeight: 700, color: '#7c5cfc' }}>{angleDeg.toFixed(1)}°</span>
                    </div>
                    <div style={simStyles.resultRow}>
                        <span style={{ color: 'var(--text-dim)' }}>유클리드 거리:</span>
                        <span style={{ fontWeight: 700, color: '#22d3ee' }}>{dist.toFixed(2)}</span>
                    </div>
                    <div style={simStyles.interpretation}>
                        {sim > 0.8 ? '🧲 매우 비슷! 같은 카테고리에 속할 가능성 높음' :
                            sim > 0.3 ? '📏 약간 비슷하지만 다른 맥락도 있음' :
                                sim > 0 ? '🔀 꽤 다른 의미의 단어들' :
                                    '⚡ 반대 방향! 대조적인 의미'}
                    </div>
                </div>
            )}

            {/* Word2Vec 벡터 연산 체험 */}
            <VectorArithmeticPanel />
        </div>
    );
}

// Three.js는 SSR 미지원 → 동적 임포트
const EmbeddingGalaxy = dynamic(() => import('@/components/3d/EmbeddingGalaxy'), {
    ssr: false,
    loading: () => (
        <div style={loadingStyle}>
            <div className="animate-pulse-glow" style={loadingBox}>
                🌌 은하수 로딩 중...
            </div>
        </div>
    ),
});

export default function Week4Page() {
    const isMobile = useIsMobile();
    const studentName = useClassStore((s) => s.studentName);
    const schoolCode = useClassStore((s) => s.schoolCode);
    const roomCode = useClassStore((s) => s.roomCode);
    const students = useClassStore((s) => s.students);
    const setStudents = useClassStore((s) => s.setStudents);
    const addStudent = useClassStore((s) => s.addStudent);
    const removeStudent = useClassStore((s) => s.removeStudent);
    const addNotification = useClassStore((s) => s.addNotification);

    const stars = useGalaxyStore((s) => s.stars);
    const addOrUpdateStar = useGalaxyStore((s) => s.addOrUpdateStar);
    const removeStar = useGalaxyStore((s) => s.removeStar);
    const loadFromRoomState = useGalaxyStore((s) => s.loadFromRoomState);
    const myWord = useGalaxyStore((s) => s.myWord);
    const setMyWord = useGalaxyStore((s) => s.setMyWord);
    const myPosition = useGalaxyStore((s) => s.myPosition);
    const setMyPosition = useGalaxyStore((s) => s.setMyPosition);

    const [wordInput, setWordInput] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);

    // ── Socket 이벤트 리스너 ──
    useEffect(() => {
        const socket = getSocket();

        // 소켓이 연결되어 있지 않으면 연결 + 방 재입장
        if (!socket.connected) {
            connectSocket();
        }

        // 연결 시 방에 자동 입장 (직접 URL 접근 또는 재연결 시)
        const handleConnect = () => {
            if (roomCode) {
                socket.emit('join_class', {
                    studentName: studentName || '익명',
                    schoolCode: schoolCode || 'UNKNOWN',
                    roomCode,
                });
            }
        };

        // 이미 연결 상태라면 바로 방 입장
        if (socket.connected && roomCode) {
            handleConnect();
        }

        socket.on('connect', handleConnect);

        const handleRoomState = (data) => {
            setStudents(data.students);
            loadFromRoomState(data.students);
        };
        const handleStudentJoined = (data) => {
            addStudent(data.student);
            addNotification(`🚀 ${data.student.studentName} 입장! (${data.totalCount}명)`);
        };
        const handleStudentLeft = (data) => {
            removeStudent(data.studentId);
            removeStar(data.studentId);
            addNotification(`💫 ${data.studentName} 퇴장 (${data.totalCount}명)`);
        };
        const handleWordRegistered = (data) => {
            addOrUpdateStar(data.studentId, {
                studentName: data.studentName,
                word: data.word,
                position: data.position,
                color: data.color,
            });
        };
        const handleWordMoved = (data) => {
            addOrUpdateStar(data.studentId, {
                position: data.position,
            });
        };

        socket.on('room_state', handleRoomState);
        socket.on('student_joined', handleStudentJoined);
        socket.on('student_left', handleStudentLeft);
        socket.on('word_registered', handleWordRegistered);
        socket.on('word_moved', handleWordMoved);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('room_state', handleRoomState);
            socket.off('student_joined', handleStudentJoined);
            socket.off('student_left', handleStudentLeft);
            socket.off('word_registered', handleWordRegistered);
            socket.off('word_moved', handleWordMoved);
        };
    }, [roomCode]);

    // ── 단어 등록 ──
    const handleRegisterWord = useCallback(() => {
        if (!wordInput.trim()) return;
        const socket = getSocket();
        const word = wordInput.trim();
        setMyWord(word);

        // 로컬에 즉시 별 추가 (서버 응답 전에 바로 보이게)
        const myColor = `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`;
        const localPos = {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10,
            z: (Math.random() - 0.5) * 10,
        };
        addOrUpdateStar(socket.id || 'local', {
            studentName: studentName || '나',
            word,
            position: localPos,
            color: myColor,
        });
        setMyPosition(localPos);

        // 서버에도 전송 (서버 응답이 오면 덮어씀)
        socket.emit('register_word', { word });
        setIsRegistered(true);
    }, [wordInput, setMyWord, studentName, addOrUpdateStar, setMyPosition]);

    // ── 슬라이더로 좌표 변경 ──
    const handleSlider = useCallback(
        (axis, value) => {
            const newPos = { ...myPosition, [axis]: parseFloat(value) };
            setMyPosition(newPos);

            // 로컬 별 위치도 즉시 업데이트
            const socket = getSocket();
            addOrUpdateStar(socket.id || 'local', { position: newPos });

            socket.emit('update_word_position', { position: newPos });
        },
        [myPosition, setMyPosition, addOrUpdateStar]
    );

    const starCount = Object.keys(stars).length;

    return (
        <div style={{
            ...styles.container,
            ...(isMobile ? { flexDirection: 'column', height: 'auto', minHeight: '100vh', overflow: 'auto' } : {}),
        }}>
            {/* ── 모바일: 3D 캔버스 상단 ── */}
            {isMobile && (
                <div style={{ width: '100%', height: 300, position: 'relative', flexShrink: 0 }}>
                    <WebGLErrorBoundary fallbackProps={{
                        weekTitle: '3D 임베딩 은하수',
                        conceptSummary: '임베딩(Embedding)은 단어를 벡터(숫자 목록)로 변환하는 기술입니다. 비슷한 의미의 단어("고양이"↔"강아지")는 벡터 공간에서 가까운 위치에, 다른 의미("고양이"↔"자동차")는 먼 위치에 놓입니다.',
                    }}>
                        <EmbeddingGalaxy />
                    </WebGLErrorBoundary>
                    <div style={styles.canvasOverlay}>
                        <span className="badge-glow" style={{ fontSize: '0.75rem' }}>
                            🌌 터치로 탐색
                        </span>
                    </div>
                </div>
            )}

            {/* ── 좌측 패널 ── */}
            <div style={{
                ...styles.leftPanel,
                ...(isMobile ? { width: '100%', minWidth: 0, height: 'auto', borderRight: 'none', borderTop: '1px solid var(--border-subtle)' } : {}),
            }}>
                {/* 헤더 */}
                <Breadcrumb
                    items={[{ label: '4주차 인트로', href: '/week4/intro' }]}
                    current="임베딩 은하수"
                />
                <div style={styles.header}>
                    <h2 style={styles.weekTitle}>4주차</h2>
                    <h1 style={styles.moduleTitle}>
                        <span className="text-gradient">3D 임베딩 은하수</span>
                    </h1>
                    <p style={styles.description}>
                        단어를 입력하고 좌표를 움직여 보세요.<br />
                        모든 친구들의 별이 실시간으로 연결됩니다! ✨
                    </p>
                </div>

                {/* 접속 현황 */}
                <div className="glass-card" style={styles.statusCard}>
                    <div style={styles.statusRow}>
                        <span className="badge-glow online">🟢 온라인</span>
                        <span style={styles.statusText}>
                            {students.length}명 접속 · {starCount}개 별
                        </span>
                    </div>
                </div>

                {/* 단어 입력 */}
                {!isRegistered ? (
                    <div className="glass-card" style={styles.inputCard}>
                        <label className="label-cosmic">나만의 단어 별 만들기 🌟</label>
                        <p style={styles.inputHint}>
                            좋아하는 음식, 동물, 취미 등 아무 단어나 입력하세요!
                        </p>
                        <input
                            className="input-cosmic"
                            placeholder="예: 마라탕, 고양이, 축구..."
                            value={wordInput}
                            onChange={(e) => setWordInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRegisterWord()}
                            maxLength={10}
                        />
                        <button
                            className="btn-nova"
                            style={styles.registerBtn}
                            onClick={handleRegisterWord}
                            disabled={!wordInput.trim()}
                        >
                            <span>⭐ 별 생성하기</span>
                        </button>
                    </div>
                ) : (
                    /* 좌표 슬라이더 */
                    <div className="glass-card" style={styles.sliderCard}>
                        <div style={styles.myWordBadge}>
                            <span style={{ fontSize: '1.4rem' }}>⭐</span>
                            <span style={{ fontWeight: 700, color: 'var(--accent-laser-gold)' }}>
                                {myWord}
                            </span>
                        </div>

                        <label className="label-cosmic">의미 좌표 조종석</label>
                        <p style={styles.inputHint}>
                            슬라이더를 움직여 별의 위치를 바꿔보세요. 비슷한 단어끼리 가까이 놓으면 군집이 만들어집니다!
                        </p>

                        {['x', 'y', 'z'].map((axis) => (
                            <div key={axis} style={styles.sliderRow}>
                                <span style={styles.axisLabel}>
                                    {axis === 'x' ? '↔️ X축' : axis === 'y' ? '↕️ Y축' : '↗️ Z축'}
                                </span>
                                <input
                                    type="range"
                                    className="slider-cosmic"
                                    min={-8}
                                    max={8}
                                    step={0.1}
                                    value={myPosition[axis]}
                                    onChange={(e) => handleSlider(axis, e.target.value)}
                                />
                                <span style={styles.sliderValue}>
                                    {myPosition[axis].toFixed(1)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── 코사인 유사도 계산기 ── */}
                <CosineSimilarityPanel stars={stars} />

                {/* 접속자 리스트 */}
                <div className="glass-card" style={styles.studentList}>
                    <label className="label-cosmic">은하수 탐험대 👨‍🚀</label>
                    <div style={styles.studentScroll}>
                        {Object.entries(stars).map(([id, star]) => (
                            <div key={id} style={styles.studentItem}>
                                <div
                                    style={{
                                        ...styles.studentDot,
                                        background: star.color,
                                    }}
                                />
                                <span style={styles.studentNameText}>{star.studentName}</span>
                                <span style={styles.studentWord}>{star.word}</span>
                            </div>
                        ))}
                        {starCount === 0 && (
                            <p style={styles.emptyText}>
                                아직 아무도 별을 만들지 않았어요...
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Theory Section ── */}
                <div className="glass-card" style={styles.card}>
                    <label className="label-cosmic">🤖 LLM의 뇌를 들여다보면?</label>
                    <div style={{ ...styles.description, fontSize: '0.85rem' }}>
                        <p style={{ marginBottom: 10 }}>
                            <strong>1. 의미의 공간 (Vector Space)</strong><br />
                            LLM은 단어의 뜻을 사전에서 찾는 게 아니라, 이 3D 은하수 같은 <strong>"벡터 공간"</strong>에서의 위치로 이해합니다.
                            "왕"과 "여왕"은 가깝고, "사과"는 멀리 떨어져 있겠죠?
                        </p>
                        <p>
                            <strong>2. 검색 증강 생성 (RAG)</strong><br />
                            여러분이 챗봇에게 회사 문서를 물어보면, AI는 그 문서들을 벡터로 바꿔서 저장해둡니다.
                            그리고 질문과 가장 가까운 위치에 있는 문서를 찾아(Search) 답변을 생성(Generate)합니다!
                        </p>
                    </div>
                </div>
            </div>

            {/* ── 우측: 3D 캔버스 (데스크톱만) ── */}
            {!isMobile && (
                <div style={styles.canvasWrapper}>
                    <WebGLErrorBoundary fallbackProps={{
                        weekTitle: '3D 임베딩 은하수',
                        conceptSummary: '임베딩(Embedding)은 단어를 벡터(숫자 목록)로 변환하는 기술입니다. 비슷한 의미의 단어("고양이"↔"강아지")는 벡터 공간에서 가까운 위치에, 다른 의미("고양이"↔"자동차")는 먼 위치에 놓입니다. 이 거리를 코사인 유사도로 측정합니다.',
                    }}>
                        <EmbeddingGalaxy />
                    </WebGLErrorBoundary>

                    {/* 오버레이 UI */}
                    <div style={styles.canvasOverlay}>
                        <span className="badge-glow" style={{ fontSize: '0.8rem' }}>
                            🌌 단어 은하수 · 마우스로 드래그하여 탐색
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
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-void)',
};

const loadingBox = {
    padding: '24px 48px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-glass)',
    color: 'var(--text-secondary)',
    fontSize: '1.1rem',
};

const simStyles = {
    panel: { padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
    hint: { fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5 },
    selectLabel: { fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: 4, fontWeight: 600 },
    resultBox: {
        padding: 12, borderRadius: 'var(--radius-sm)',
        background: 'rgba(124, 92, 252, 0.06)', border: '1px solid rgba(124, 92, 252, 0.15)',
        display: 'flex', flexDirection: 'column', gap: 6,
    },
    resultRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' },
    interpretation: {
        fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center',
        marginTop: 4, padding: '6px 0', borderTop: '1px solid rgba(124,92,252,0.1)',
    },
    funFact: {
        padding: 10, borderRadius: 'var(--radius-sm)',
        background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
        fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6,
    },
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
    header: {
        marginBottom: 4,
    },
    weekTitle: {
        fontSize: '0.85rem',
        color: 'var(--accent-pulsar)',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    moduleTitle: {
        fontSize: '1.6rem',
        fontWeight: 800,
        marginBottom: 8,
    },
    description: {
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
    },
    statusCard: {
        padding: 14,
    },
    statusRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    statusText: {
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
    },
    inputCard: {
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    inputHint: {
        fontSize: '0.82rem',
        color: 'var(--text-dim)',
        lineHeight: 1.5,
    },
    registerBtn: {
        marginTop: 4,
        width: '100%',
    },
    sliderCard: {
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
    },
    myWordBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        background: 'rgba(251, 191, 36, 0.1)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
    },
    sliderRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    axisLabel: {
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        minWidth: 60,
    },
    sliderValue: {
        fontSize: '0.8rem',
        fontWeight: 700,
        color: 'var(--accent-star-cyan)',
        minWidth: 40,
        textAlign: 'right',
        fontFamily: 'monospace',
    },
    studentList: {
        padding: 16,
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
    },
    studentScroll: {
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginTop: 8,
    },
    studentItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(124, 92, 252, 0.05)',
    },
    studentDot: {
        width: 10,
        height: 10,
        borderRadius: '50%',
        flexShrink: 0,
    },
    studentNameText: {
        fontSize: '0.82rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
    },
    studentWord: {
        fontSize: '0.75rem',
        color: 'var(--text-dim)',
        marginLeft: 'auto',
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
