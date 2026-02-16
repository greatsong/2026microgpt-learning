require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// ── CORS & Socket.io 설정 ──
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3030'] }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3030'],
    methods: ['GET', 'POST'],
  },
});

// ── 교사 비밀번호 (환경변수 또는 기본값) ──
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'teacher2025';

// ── 교실(방) 상태 저장소 ──
const rooms = new Map(); // roomCode → { students: Map<socketId, studentInfo>, teacherId: null }

// ── 임베딩 사전 좌표 (카테고리별 군집) ──
const WORD_CLUSTERS = {
  동물: { center: { x: -4, y: 3, z: -2 }, words: ['고양이', '강아지', '사자', '호랑이', '토끼', '새', '물고기', '코끼리', 'cat', 'dog', 'lion', 'tiger', 'rabbit', 'bird', 'fish', 'elephant'] },
  음식: { center: { x: 4, y: -2, z: 3 }, words: ['사과', '바나나', '피자', '치킨', '밥', '김치', '라면', 'apple', 'banana', 'pizza', 'chicken', 'rice', 'food', 'bread'] },
  감정: { center: { x: 0, y: 4, z: 4 }, words: ['행복', '슬픔', '기쁨', '분노', '사랑', '두려움', 'happy', 'sad', 'joy', 'anger', 'love', 'fear', 'hope'] },
  자연: { center: { x: -3, y: -3, z: -4 }, words: ['하늘', '바다', '산', '꽃', '나무', '비', '눈', '태양', 'sky', 'sea', 'mountain', 'flower', 'tree', 'rain', 'sun'] },
  기술: { center: { x: 3, y: 3, z: -3 }, words: ['컴퓨터', '인공지능', 'AI', 'GPT', '로봇', '코딩', '데이터', 'computer', 'robot', 'coding', 'data', 'program'] },
  학교: { center: { x: -4, y: -1, z: 4 }, words: ['학교', '학생', '선생님', '공부', '시험', '교실', '숙제', 'school', 'student', 'teacher', 'study', 'exam'] },
};

function getWordPosition(word) {
  const lowerWord = word.toLowerCase();
  for (const [, cluster] of Object.entries(WORD_CLUSTERS)) {
    if (cluster.words.some(w => lowerWord.includes(w.toLowerCase()) || w.toLowerCase().includes(lowerWord))) {
      return {
        x: cluster.center.x + (Math.random() - 0.5) * 2,
        y: cluster.center.y + (Math.random() - 0.5) * 2,
        z: cluster.center.z + (Math.random() - 0.5) * 2,
      };
    }
  }
  // 매칭 없으면 랜덤 (원점 근처)
  return {
    x: (Math.random() - 0.5) * 10,
    y: (Math.random() - 0.5) * 10,
    z: (Math.random() - 0.5) * 10,
  };
}

// ── 유틸 ──
function getRoomState(roomCode) {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, { students: new Map(), teacherId: null });
  }
  return rooms.get(roomCode);
}

function isTeacher(socketId, roomCode) {
  const room = rooms.get(roomCode);
  return room && room.teacherId === socketId;
}

function broadcastRoomUpdate(roomCode) {
  const room = getRoomState(roomCode);
  const studentList = Array.from(room.students.values());
  io.to(roomCode).emit('room_update', {
    studentCount: studentList.length,
    students: studentList,
  });
}

// ── 손실 함수 ──
function lossFunction(x, z) {
  const bowl = 0.03 * (x * x + z * z);
  const globalMin = -2.5 * Math.exp(-(x * x + (z - 2) * (z - 2)) / 3);
  const localMin1 = -1.0 * Math.exp(-((x + 3) * (x + 3) + (z + 2) * (z + 2)) / 2);
  const localMin2 = -1.2 * Math.exp(-((x - 3) * (x - 3) + (z + 2) * (z + 2)) / 2);
  const noise = 0.2 * Math.sin(x) * Math.cos(z);
  return bowl + globalMin + localMin1 + localMin2 + noise + 3;
}

function gradient(x, z) {
  let gx = 0.06 * x;
  let gz = 0.06 * z;
  const expGlobal = Math.exp(-(x * x + (z - 2) * (z - 2)) / 3);
  gx += -2.5 * expGlobal * (-2 * x / 3);
  gz += -2.5 * expGlobal * (-2 * (z - 2) / 3);
  const expL1 = Math.exp(-((x + 3) * (x + 3) + (z + 2) * (z + 2)) / 2);
  gx += -1.0 * expL1 * (-2 * (x + 3) / 2);
  gz += -1.0 * expL1 * (-2 * (z + 2) / 2);
  const expL2 = Math.exp(-((x - 3) * (x - 3) + (z + 2) * (z + 2)) / 2);
  gx += -1.2 * expL2 * (-2 * (x - 3) / 2);
  gz += -1.2 * expL2 * (-2 * (z + 2) / 2);
  gx += 0.2 * Math.cos(x) * Math.cos(z);
  gz += 0.2 * Math.sin(x) * -Math.sin(z);
  return { gx, gz };
}

// ── Socket.io 이벤트 핸들러 ──
io.on('connection', (socket) => {
  console.log(`✨ 연결: ${socket.id}`);
  let currentRoom = null;
  let studentInfo = null;

  // ▸ 학생 입장
  socket.on('join_class', (payload) => {
    const { studentName, schoolCode, roomCode } = payload;
    currentRoom = roomCode;
    studentInfo = {
      id: socket.id,
      studentName,
      schoolCode,
      roomCode,
      joinedAt: Date.now(),
      word: null,
      position: { x: 0, y: 0, z: 0 },
      color: `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`,
      role: null,
      sliderValue_Q: 0,
      sliderValue_K: 0,
    };

    socket.join(roomCode);
    const room = getRoomState(roomCode);
    room.students.set(socket.id, studentInfo);

    console.log(`🚀 ${studentName}(${schoolCode}) → 방 [${roomCode}] 입장 (${room.students.size}명)`);

    io.to(roomCode).emit('student_joined', {
      student: studentInfo,
      totalCount: room.students.size,
    });

    socket.emit('room_state', {
      students: Array.from(room.students.values()),
      roomCode,
    });

    broadcastRoomUpdate(roomCode);
  });

  // ▸ 교사 관제탑 입장 (비밀번호 인증)
  socket.on('join_dashboard', (payload) => {
    const { roomCode, password } = payload;

    // 비밀번호 확인 (password가 없으면 이전 버전 호환을 위해 허용)
    if (password && password !== TEACHER_PASSWORD) {
      socket.emit('auth_error', { message: '교사 비밀번호가 올바르지 않습니다.' });
      return;
    }

    currentRoom = roomCode;
    socket.join(roomCode);
    const room = getRoomState(roomCode);
    room.teacherId = socket.id;

    console.log(`🎓 교사 관제탑 연결 → 방 [${roomCode}]`);

    socket.emit('room_state', {
      students: Array.from(room.students.values()),
      roomCode,
      raceTeams: room.raceTeams || {},
      racePhase: room.racePhase || 'waiting',
      raceBalls: room.raceBalls || {},
    });
  });

  // ▸ 3D 은하수: 단어 등록 (카테고리 기반 좌표)
  socket.on('register_word', (payload) => {
    if (!currentRoom) return;
    const room = getRoomState(currentRoom);
    const student = room.students.get(socket.id);
    if (!student) return;

    student.word = payload.word;
    student.position = getWordPosition(payload.word);

    io.to(currentRoom).emit('word_registered', {
      studentId: socket.id,
      studentName: student.studentName,
      word: student.word,
      position: student.position,
      color: student.color,
    });
  });

  // ▸ 3D 은하수: 좌표 이동 (슬라이더 조작)
  socket.on('update_word_position', (payload) => {
    if (!currentRoom) return;
    const room = getRoomState(currentRoom);
    const student = room.students.get(socket.id);
    if (!student) return;

    student.position = payload.position;

    socket.to(currentRoom).emit('word_moved', {
      studentId: socket.id,
      studentName: student.studentName,
      word: student.word,
      position: student.position,
      color: student.color,
    });
  });

  // ▸ 어텐션 게임: 슬라이더 업데이트
  socket.on('update_attention_slider', (payload) => {
    if (!currentRoom) return;
    const room = getRoomState(currentRoom);
    const student = room.students.get(socket.id);
    if (!student) return;

    student.role = payload.role ?? student.role;
    student.sliderValue_Q = payload.sliderValue_Q ?? student.sliderValue_Q;
    student.sliderValue_K = payload.sliderValue_K ?? student.sliderValue_K;
    student.attentionWeights = payload.attentionWeights ?? student.attentionWeights;
    student.selectedWord = payload.selectedWord ?? student.selectedWord;
    student.sentenceName = payload.sentenceName ?? student.sentenceName;
    student.headCount = payload.headCount ?? student.headCount;

    io.to(currentRoom).emit('attention_updated', {
      studentId: socket.id,
      studentName: student.studentName,
      role: student.role,
      sliderValue_Q: student.sliderValue_Q,
      sliderValue_K: student.sliderValue_K,
      attentionWeights: student.attentionWeights,
      selectedWord: student.selectedWord,
      sentenceName: student.sentenceName,
      headCount: student.headCount,
    });
  });

  // ═══════════════════════════════════════════════
  // ▸ 경사하강법 레이싱 시스템
  // ═══════════════════════════════════════════════

  // 팀 파라미터 등록
  socket.on('set_race_params', (payload) => {
    if (!currentRoom) return;
    const room = getRoomState(currentRoom);
    if (!room.raceTeams) room.raceTeams = {};

    const teamId = payload.teamId || socket.id;
    room.raceTeams[teamId] = {
      id: teamId,
      name: payload.teamName || studentInfo?.studentName || 'Team',
      color: payload.color || `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`,
      learningRate: Math.max(0.001, Math.min(2.0, payload.learningRate || 0.1)),
      momentum: Math.max(0, Math.min(0.99, payload.momentum || 0.9)),
      memberId: socket.id,
    };

    console.log(`🏎️ 팀 [${room.raceTeams[teamId].name}] 파라미터: lr=${payload.learningRate}, m=${payload.momentum}`);

    io.to(currentRoom).emit('race_teams_updated', {
      teams: room.raceTeams,
    });
  });

  // 교사: 레이스 시작 (교사 권한 체크)
  socket.on('start_race', () => {
    if (!currentRoom) return;
    const room = getRoomState(currentRoom);
    // 교사이거나 솔로 모드(학생이 직접 시작)인 경우만 허용
    if (room.teacherId && !isTeacher(socket.id, currentRoom)) return;
    if (!room.raceTeams || Object.keys(room.raceTeams).length === 0) return;

    const angle = Math.random() * Math.PI * 2;
    const radius = 6 + Math.random() * 2;
    const centerX = Math.cos(angle) * radius;
    const centerZ = Math.sin(angle) * radius;

    room.raceBalls = {};
    room.raceFinished = {};

    for (const [teamId, team] of Object.entries(room.raceTeams)) {
      room.raceBalls[teamId] = {
        x: centerX + (Math.random() - 0.5) * 1.0,
        z: centerZ + (Math.random() - 0.5) * 1.0,
        y: 0,
        vx: 0,
        vz: 0,
        trail: [],
        status: 'racing',
        loss: 0,
        lr: team.learningRate,
        momentum: team.momentum,
      };
      room.raceBalls[teamId].y = lossFunction(room.raceBalls[teamId].x, room.raceBalls[teamId].z);
      room.raceBalls[teamId].loss = room.raceBalls[teamId].y;
    }

    room.racePhase = 'racing';
    room.raceStartTime = Date.now();

    io.to(currentRoom).emit('race_started', {
      balls: room.raceBalls,
      startTime: room.raceStartTime,
    });

    console.log(`🏁 레이스 시작! 방 [${currentRoom}] — ${Object.keys(room.raceTeams).length}팀`);

    // 물리 시뮬레이션 루프 (30fps)
    if (room.raceInterval) clearInterval(room.raceInterval);
    const roomCode = currentRoom; // 클로저에 roomCode 캡처
    room.raceInterval = setInterval(() => {
      const r = rooms.get(roomCode);
      if (!r || r.racePhase !== 'racing') {
        clearInterval(r?.raceInterval);
        return;
      }

      let allDone = true;

      for (const [teamId, ball] of Object.entries(r.raceBalls)) {
        if (ball.status !== 'racing') continue;
        allDone = false;

        const grad = gradient(ball.x, ball.z);
        ball.vx = ball.momentum * ball.vx - ball.lr * grad.gx;
        ball.vz = ball.momentum * ball.vz - ball.lr * grad.gz;
        ball.x += ball.vx;
        ball.z += ball.vz;
        ball.y = lossFunction(ball.x, ball.z);
        ball.loss = ball.y;

        ball.trail.push({ x: ball.x, y: ball.y, z: ball.z });
        if (ball.trail.length > 200) ball.trail.shift();

        if (Math.abs(ball.x) > 12 || Math.abs(ball.z) > 12 || ball.y > 10) {
          ball.status = 'escaped';
          r.raceFinished[teamId] = {
            teamId,
            teamName: r.raceTeams[teamId]?.name,
            finalLoss: ball.loss,
            status: 'escaped',
            time: Date.now() - r.raceStartTime,
          };
          io.to(roomCode).emit('race_alert', {
            teamId,
            teamName: r.raceTeams[teamId]?.name,
            message: '🚨 공 이탈! 학습률이 너무 큽니다!',
          });
        }

        const speed = Math.sqrt(ball.vx * ball.vx + ball.vz * ball.vz);
        if (speed < 0.001 && ball.trail.length > 30) {
          ball.status = 'converged';
          r.raceFinished[teamId] = {
            teamId,
            teamName: r.raceTeams[teamId]?.name,
            finalLoss: ball.loss,
            status: 'converged',
            time: Date.now() - r.raceStartTime,
          };
        }
      }

      io.to(roomCode).emit('race_tick', { balls: r.raceBalls });

      const totalTeams = Object.keys(r.raceBalls).length;
      const finishedTeams = Object.keys(r.raceFinished).length;
      if (finishedTeams >= totalTeams || allDone) {
        clearInterval(r.raceInterval);
        r.raceInterval = null;
        r.racePhase = 'finished';

        const results = Object.values(r.raceFinished)
          .sort((a, b) => {
            if (a.status === 'escaped' && b.status !== 'escaped') return 1;
            if (b.status === 'escaped' && a.status !== 'escaped') return -1;
            return a.finalLoss - b.finalLoss;
          })
          .map((r, i) => ({ ...r, rank: i + 1 }));

        io.to(roomCode).emit('race_finished', { results });
        console.log(`🏆 레이스 종료! 방 [${roomCode}]`, results);
      }
    }, 33);
  });

  // 교사: 레이스 리셋 (교사 권한 체크)
  socket.on('reset_race', () => {
    if (!currentRoom) return;
    const room = getRoomState(currentRoom);
    if (room.teacherId && !isTeacher(socket.id, currentRoom)) return;
    if (room.raceInterval) { clearInterval(room.raceInterval); room.raceInterval = null; }
    room.racePhase = 'setup';
    room.raceBalls = {};
    room.raceFinished = {};
    io.to(currentRoom).emit('race_reset');
    console.log(`🔄 레이스 리셋! 방 [${currentRoom}]`);
  });

  // ▸ 교사 명령 (교사 권한 체크)
  socket.on('teacher_command', (payload) => {
    if (!currentRoom) return;
    if (!isTeacher(socket.id, currentRoom)) {
      socket.emit('auth_error', { message: '교사 권한이 필요합니다.' });
      return;
    }
    console.log(`🎓 교사 명령: ${payload.command}`);
    io.to(currentRoom).emit('teacher_command', payload);
  });

  // ▸ 연결 해제
  socket.on('disconnect', () => {
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (!room) return;

      const student = room.students.get(socket.id);

      if (student) {
        console.log(`💫 ${student.studentName} 퇴장 (방 [${currentRoom}])`);
        room.students.delete(socket.id);

        io.to(currentRoom).emit('student_left', {
          studentId: socket.id,
          studentName: student.studentName,
          totalCount: room.students.size,
        });

        broadcastRoomUpdate(currentRoom);
      }

      // 교사 퇴장 시 teacherId 초기화 + interval 정리
      if (room.teacherId === socket.id) {
        console.log(`🎓 교사 퇴장 (방 [${currentRoom}])`);
        room.teacherId = null;
        if (room.raceInterval) {
          clearInterval(room.raceInterval);
          room.raceInterval = null;
        }
      }

      // 빈 방 정리 (학생 0명 + 교사 없음)
      if (room.students.size === 0 && !room.teacherId) {
        if (room.raceInterval) { clearInterval(room.raceInterval); room.raceInterval = null; }
        rooms.delete(currentRoom);
        console.log(`🗑️ 빈 방 삭제: [${currentRoom}]`);
      }
    }
    console.log(`🌙 연결 해제: ${socket.id}`);
  });
});

// ── REST API ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/rooms', (req, res) => {
  const roomList = [];
  rooms.forEach((room, code) => {
    roomList.push({
      roomCode: code,
      studentCount: room.students.size,
      hasTeacher: !!room.teacherId,
    });
  });
  res.json(roomList);
});

// ── 서버 시작 ──
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║  🚀 GPT야 놀자! 백엔드 서버 가동 중          ║
  ║  📡 Port: ${PORT}                              ║
  ║  🌐 CORS: ${FRONTEND_URL}               ║
  ╚══════════════════════════════════════════════╝
  `);
});
