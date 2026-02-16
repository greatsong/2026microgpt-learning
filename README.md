# 🤖 MicroPGT: 3D Learning Lab

### "ChatGPT의 뇌를 직접 만져보는 3D 교실"

이 프로젝트는 학생들이 LLM(대규모 언어 모델)의 핵심 원리인 **임베딩, 어텐션, 경사하강법, 역전파** 등을 3D 시각화와 멀티플레이어 게임으로 체험할 수 있도록 설계된 교육용 웹 애플리케이션입니다.

---

## 💻 사전 준비 (Prerequisites)

이 프로젝트를 실행하려면 컴퓨터에 **Node.js**가 설치되어 있어야 합니다.
*   터미널에 `node -v`를 입력했을 때 버전 숫자가 나오면 OK! (v18 이상 권장)
*   없다면 [Node.js 공식 홈페이지](https://nodejs.org/)에서 'LTS 버전'을 다운로드하여 설치하세요.

---

## 🚀 시작하기 (Getting Started)

이 프로젝트는 **프론트엔드(Next.js)**와 **백엔드(Express + Socket.io)** 두 개의 서버를 동시에 실행해야 합니다.

### 1. 프로젝트 다운로드 & 설치
```bash
# 프로젝트 폴더로 이동
cd 260215_micropgt_3d_learning

# 프론트엔드 패키지 설치
cd frontend
npm install

# 백엔드 패키지 설치
cd ../backend
npm install
```

### 2. 서버 실행 (터미널 2개 필요)

**터미널 1 (백엔드):**
```bash
cd backend
npm start
# 📡 Port: 4000
# 🌐 Socket.io Server Active
```

**터미널 2 (프론트엔드):**
```bash
cd frontend
npm run dev
# 🟢 Ready on http://localhost:3000
```

### 3. 접속
브라우저에서 `http://localhost:3000`으로 접속하세요.

---

## ❓ 자주 묻는 질문 (Troubleshooting)

**Q. `EADDRINUSE` 에러가 떠요!**
*   이미 3000번이나 4000번 포트를 다른 프로그램이 쓰고 는 경우입니다.
*   실행 중인 터미널을 모두 끄거나, 컴퓨터를 재부팅하고 다시 시도하세요.

**Q. 학생이 접속했는데 화면이 안 보여요.**
*   방화벽 문제일 수 있습니다. 선생님 노트북의 **[방화벽 해제]** 또는 **[공용 네트워크 허용]** 설정을 확인해주세요.
*   반드시 같은 와이파이(5G/2G 구분 포함)에 연결되어 있어야 합니다.

---

## 🎒 수업 활용 가이드 (For Teachers)

이 앱은 **"로컬 네트워크(Localhost + Same Wi-Fi)"** 환경에서 가장 잘 작동합니다.

1.  **선생님 컴퓨터**에서 위 명령어대로 서버를 켭니다.
2.  선생님 컴퓨터의 **ipconfig(윈도우) / ifconfig(맥)**를 확인하여 내부 IP 주소(예: `192.168.0.x`)를 알아냅니다.
3.  학생들에게 `http://192.168.0.x:3000` 주소를 공유합니다. (같은 와이파이에 접속해 있어야 합니다.)
4.  **관제탑 모드**: 선생님은 `/dashboard` 페이지로 들어가 전체 학생들의 활동을 모니터링하고 제어할 수 있습니다.

---

## ⚠️ 배포 주의사항 (Deployment Note)

이 프로젝트는 **Stateful Server (상태 유지 서버)** 구조로 설계되었습니다.
따라서 Vercel, Netlify 같은 일반적인 **Serverless 환경에서는 정상 작동하지 않습니다.**

*   **이유**:
    1.  서버 메모리에 학생 위치, 게임 점수 등을 실시간 저장합니다. (새로고침 시 초기화됨)
    2.  Socket.io를 통한 지속적인 양방향 통신이 필요합니다.
    3.  물리 엔진(레이싱)이 백엔드 루프(`setInterval`)에서 30fps로 계속 돌아가야 합니다.
*   **추천 배포**: AWS EC2, Railway, Render (Docker 기반) 등의 **가상 서버(VPS)** 환경 권장.

---

## 📚 커리큘럼 구성

| 주차 | 주제 | 내용 (Activity) | 핵심 이론 (Theory) |
| :--- | :--- | :--- | :--- |
| **W1** | 토크나이저 | 텍스트 분해기 | LLM의 언어 단위 |
| **W2** | 다음 토큰 예측 | 확률 제어 실험 | Temperature & Sampling |
| **W3** | **임베딩 (3D)** | 단어 우주 탐험 | Vector Space & RAG |
| **W5** | **경사하강법** | 손실 함수 레이싱 | GPU 학습 비용 & 최적화 |
| **W6** | 뉴런 실험실 | 파라미터 조작 | 1000억 파라미터의 의미 |
| **W7** | 역전파 | 오차 역전파 추적 | 딥러닝 학습 원리 |
| **W8** | RNN & PE | 위치 인코딩 시각화 | 병렬 처리 & 트랜스포머 |
| **W10** | **어텐션 (핵심)** | Q, K, V 관계도 | Context Window |
| **W12** | 정규화 (RMS) | 그래디언트 폭발 방지 | LLM 안정성 |
| **W13** | **GPT 아키텍처** | 트랜스포머 블록 조립 | Decoder-only 구조 |
| **W14** | **RLHF** | AI 윤리 조련소 | Alignment & Safety |
| **W15** | 해커톤 | 나만의 AI 서비스 | 창의적 응용 |

---

## 🛠️ 기술 스택 (Tech Stack)

*   **Frontend**: Next.js 14 (App Router), Three.js (@react-three/fiber), Framer Motion, TailwindCSS
*   **Backend**: Node.js, Express, Socket.io (Real-time Communication)
*   **Design**: Glassmorphism UI (Cyberpunk/Space Theme)

---

Developed by **석리송** (2026) 🚀
