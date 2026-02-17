# MicroGPT 3D Learning Lab — 개선 작업 계획서

> **이 파일을 보고 작업을 이어서 진행해줘.**
> 새 세션에서 위 문장으로 시작하면 됩니다.

---

## 📌 프로젝트 개요

- **프로젝트**: MicroGPT: 3D Learning Lab (LLM 개념을 3D 시각화와 멀티플레이어 게임으로 배우는 교육용 웹앱)
- **참고**: 폴더명이 `micropgt`로 오타가 있으나, 정식 프로젝트명은 **MicroGPT**임
- **기술 스택**: Next.js 16 (App Router) + Three.js (@react-three/fiber) + Socket.io + Express + Zustand
- **프론트엔드**: `frontend/src/app/` 아래 주차별 페이지
- **백엔드**: `backend/server.js` (Express + Socket.io)
- **3D 컴포넌트**: `frontend/src/components/3d/`
- **상태 관리**: `frontend/src/stores/` (Zustand 3개 스토어)
- **스타일**: `frontend/src/app/globals.css` (CSS 변수 + 글래스모피즘 테마)

---

## 🎯 작업 우선순위 요약

| 우선순위 | 카테고리 | 작업 수 |
|---------|---------|--------|
| **P0 (즉시)** | 콘텐츠 구체화 + 핵심 디자인 | 8개 |
| **P1 (중요)** | 인트로 페이지 통일 + UX 개선 | 6개 |
| **P2 (보완)** | 코드 품질 + 접근성 | 4개 |

---

## 📚 PART 1: 콘텐츠 개선 (교육 내용 구체화)

### 1-1. Week 1 — 토크나이저 (BPE) [P0]
- **파일**: `frontend/src/app/week1/page.js`
- **현재 문제**: 휴리스틱 기반 분리(prefix/suffix)로 실제 BPE와 동작이 다름. 한국어 미지원.
- **개선 내용**:
  - 실제 BPE 병합(merge) 과정을 단계별로 시각화 (문자 → 바이그램 빈도 → 병합 → 반복)
  - 병합 테이블을 보여주고 "다음 병합" 버튼으로 한 단계씩 진행
  - 한국어 예시 추가 (예: "안녕하세요" → ["안", "녕", "하", "세", "요"] → 병합 과정)
  - Theory 섹션에 "왜 BPE인가?" 설명 추가: 단어 단위 vs 문자 단위 vs 서브워드 비교표
  - 실제 GPT 토크나이저의 vocab size (50257) 언급

### 1-2. Week 2 — 다음 토큰 예측 [P0]
- **파일**: `frontend/src/app/week2/page.js`
- **현재 문제**: 3개 시나리오만 있고, Temperature의 수학적 의미가 부족
- **개선 내용**:
  - Temperature 공식 시각화: `softmax(logits / T)` — T가 변할 때 확률분포 막대그래프가 실시간 변화
  - Top-k, Top-p(nucleus) 샘플링 옵션 추가 (체크박스로 토글)
  - "자유 입력 모드": 사용자가 직접 단어 후보와 logit 값을 입력하여 실험
  - Theory 섹션: "언어 모델이 문장을 생성하는 방법" — 자기회귀(autoregressive) 개념 설명

### 1-3. Week 3 — 임베딩 [P1]
- **파일**: `frontend/src/app/week3/page.js`, `frontend/src/app/week3/intro/page.js`
- **현재 상태**: 인트로는 이미 풍부함 (6단계). 메인 랩도 3D 시각화 잘 되어 있음.
- **개선 내용**:
  - 메인 랩에 "코사인 유사도 계산기" 패널 추가: 두 단어를 선택하면 유사도 수치와 각도 표시
  - 사전 정의된 예시 단어 세트 제공 (동물, 음식, 감정 등 카테고리별)
  - Theory 섹션: Word2Vec의 유명한 예시 "King - Man + Woman = Queen" 설명

### 1-4. Week 5 — 경사하강법 [P1]
- **파일**: `frontend/src/app/week5/page.js`, `frontend/src/app/week5/intro/page.js`
- **현재 상태**: 인트로 풍부. 솔로/멀티플레이어 레이싱 구현.
- **개선 내용**:
  - Learning Rate가 너무 클 때 "발산(diverge)"하는 시각적 경고 추가
  - 파라미터 프리셋 버튼: "안정적", "빠르지만 위험", "느리지만 안전"
  - Loss 차트에 현재 위치 마커 표시
  - Theory 섹션: SGD vs Adam vs AdaGrad 간단 비교표

### 1-5. Week 6 — 뉴런 [P0]
- **파일**: `frontend/src/app/week6/page.js`
- **현재 문제**: 단일 뉴런 SVG만 있음. 활성화 함수 그래프 없음.
- **개선 내용**:
  - 활성화 함수별 **그래프 시각화** 추가 (Canvas): sigmoid, relu, tanh, step의 곡선을 그리고 현재 입력값 위치 표시
  - "뉴런 연결하기" 모드: 2~3개 뉴런을 연결하여 간단한 네트워크 구성 체험
  - 생물학적 뉴런 vs 인공 뉴런 비교 일러스트
  - Theory 섹션: "왜 비선형 활성화 함수가 필요한가?" — 선형만으로는 XOR 해결 불가 설명 (week7과 연결)

### 1-6. Week 7 — 역전파 [P0]
- **파일**: `frontend/src/app/week7/page.js`
- **현재 문제**: 자동 훈련만 있고, 역전파의 "체인룰" 과정이 시각적으로 보이지 않음
- **개선 내용**:
  - **역전파 단계별 시각화**: Forward pass → Loss 계산 → Backward pass (그래디언트가 화살표로 역방향 흐르는 애니메이션)
  - 각 가중치 옆에 현재 그래디언트 값(∂L/∂w) 표시
  - "수동 모드": 한 스텝씩 forward/backward 실행하며 값 변화 관찰
  - Theory 섹션: 체인룰(Chain Rule) 수식을 쉬운 예시로 설명

### 1-7. Week 8 — RNN & 포지셔널 인코딩 [P1]
- **파일**: `frontend/src/app/week8/page.js`
- **현재 상태**: RNN 기억력 시뮬레이션 + PE 시각화 잘 구현됨
- **개선 내용**:
  - RNN 탭에 LSTM/GRU 게이트 시각화 추가 (forget gate, input gate 등)
  - PE 탭에 여러 위치를 동시에 비교하는 "히트맵 뷰" 추가
  - "RNN vs Transformer" 직접 비교 데모: 같은 긴 문장을 처리할 때 차이점

### 1-8. Week 10 — 어텐션 [P0]
- **파일**: `frontend/src/app/week10/page.js`, `frontend/src/app/week10/intro/page.js`
- **현재 문제**: 인트로가 간단한 카드 한 장 (week3/5 인트로와 품질 차이 큼)
- **개선 내용**:
  - **인트로 페이지 리뉴얼**: week3/5처럼 단계별(step-based) 인트로로 확장
    - Step 1: "어텐션이란?" (검색 엔진 비유)
    - Step 2: Q, K, V 개념 시각적 설명
    - Step 3: 내적(Dot Product)으로 유사도 측정 인터랙티브 데모
    - Step 4: Softmax로 확률 변환 시각화
    - Step 5: 실제 문장에서 어텐션 가중치 히트맵
  - 메인 랩에 **Self-Attention 히트맵** 추가: "나는 빨간 사과를 먹었다" 같은 문장에서 각 단어 쌍의 어텐션 점수를 그리드로 표시
  - Multi-Head Attention 개념 설명: "여러 관점에서 동시에 바라보기"

### 1-9. Week 12 — 정규화 [P1]
- **파일**: `frontend/src/app/week12/page.js`
- **현재 문제**: RMS Norm 스캐터 플롯만 있음. 왜 필요한지 맥락 부족.
- **개선 내용**:
  - "정규화 없이 훈련" vs "정규화 있이 훈련" 비교 시뮬레이션
  - Layer Norm vs RMS Norm vs Batch Norm 비교 시각화
  - Theory: "깊은 네트워크에서 값이 폭발/소실하는 문제" 설명

### 1-10. Week 13 — GPT 아키텍처 [P0]
- **파일**: `frontend/src/app/week13/page.js`
- **현재 상태**: SVG 다이어그램 + 클릭 상세정보. 기본 구조 잘 되어 있음.
- **개선 내용**:
  - **텐서 Shape 흐름 시각화**: 각 블록을 통과할 때 데이터의 차원이 어떻게 변하는지 애니메이션
  - "N개 블록 쌓기" 슬라이더: GPT-2(12블록), GPT-3(96블록), GPT-4(추정) 등 실제 모델 크기 비교
  - Encoder-Decoder vs Decoder-only 아키텍처 비교 다이어그램
  - 각 블록 상세 설명에 파라미터 수 계산 예시 추가

### 1-11. Week 14 — RLHF [P0]
- **파일**: `frontend/src/app/week14/page.js`
- **현재 문제**: 3개 시나리오만 있어서 너무 빨리 끝남
- **개선 내용**:
  - 시나리오를 **8~10개**로 확장 (다양한 윤리적 딜레마 포함):
    - 의학 조언 요청 (할루시네이션 위험)
    - 편향된 질문 (성별/인종 편견)
    - 저작권 관련 요청
    - 개인정보 요청
    - 감정적 지지가 필요한 상황
  - 각 단계(SFT/RM/PPO)별로 여러 시나리오를 그룹핑
  - 최종 리포트: "당신이 훈련한 AI의 성향 분석" (레이더 차트)
  - Theory: DPO(Direct Preference Optimization) 등 최신 기법 간단 소개

### 1-12. Week 15 — 해커톤 [P2]
- **파일**: `frontend/src/app/week15/page.js`
- **현재 문제**: 정적 페이지. 인터랙션 없음.
- **개선 내용**:
  - "프로젝트 아이디어 생성기": 랜덤 조합으로 프로젝트 아이디어 제안
  - 이전 주차에서 배운 개념들을 체크리스트로 복습
  - 간단한 프롬프트 엔지니어링 실습 도구

---

## 🎨 PART 2: 디자인 개선

### 2-1. 인트로 페이지 일관성 통일 [P0]
- **대상 파일들**:
  - `frontend/src/app/week1/intro/page.js` — 현재: 간단한 카드 1장
  - `frontend/src/app/week10/intro/page.js` — 현재: 간단한 카드 1장
  - (week2, 6, 7, 8, 12, 13, 14, 15는 인트로 페이지 자체가 없음)
- **기준 모델**: `week3/intro/page.js` 또는 `week5/intro/page.js` (단계별 인터랙티브 인트로)
- **작업 내용**:
  - 공통 인트로 레이아웃 컴포넌트 생성: `frontend/src/components/layout/IntroTemplate.jsx`
  - 각 주차에 맞는 단계별 콘텐츠 작성
  - 일관된 네비게이션: "다음 →" 버튼으로 단계 이동, 마지막에 "실험실 입장" 버튼

### 2-2. 반응형(모바일) 대응 [P0]
- **대상**: 모든 페이지 (특히 week13의 2열 그리드, week7의 3열 레이아웃)
- **작업 내용**:
  - `globals.css`에 미디어 쿼리 추가 (`@media (max-width: 768px)`)
  - 그리드 레이아웃을 모바일에서 단일 컬럼으로 전환
  - 3D 캔버스 크기 조정
  - 터치 인터랙션 대응 (슬라이더, 버튼 크기)

### 2-3. 진행률 & 학습 경로 시각화 [P1]
- **대상**: `frontend/src/app/hub/page.js`, `frontend/src/components/layout/Sidebar.jsx`
- **작업 내용**:
  - 각 주차 카드에 완료/미완료 상태 표시 (로컬스토리지 활용)
  - Sidebar에 전체 진행률 프로그레스 바
  - 주차 간 연결선(커리큘럼 맵) 시각화

### 2-4. 다크/라이트 모드 대응 [P2]
- **현재**: 다크 모드만 존재 (우주 테마)
- **작업 내용**:
  - CSS 변수가 이미 정의되어 있으므로(`globals.css`), 라이트 모드 변수 세트 추가
  - 토글 버튼을 Sidebar 또는 Hub에 배치

### 2-5. 로딩 & 트랜지션 개선 [P1]
- **대상**: 3D 컴포넌트 로딩 시, 페이지 전환 시
- **작업 내용**:
  - 3D 씬 로딩 중 스켈레톤/스피너 표시 (현재 `ssr: false`로 dynamic import하지만 로딩 UI 없음)
  - 페이지 전환 애니메이션 (fadeInUp이 globals.css에 있지만 활용 안 됨)

### 2-6. 인라인 스타일 → CSS 모듈 전환 [P2]
- **현재 문제**: 모든 페이지가 `const styles = {...}` 인라인 스타일 사용. hover 등 pseudo-class 미지원.
- **작업 내용**:
  - 공통 스타일을 `globals.css`의 클래스로 추출
  - 반복되는 패턴(card, header, backBtn, controlPanel 등)을 공용 클래스로 통일
  - hover 효과가 필요한 버튼들에 CSS 클래스 적용

---

## 🔧 PART 3: 기능 & 코드 품질 개선

### 3-1. 인트로 없는 주차에 인트로 페이지 추가 [P1]
- **새로 생성할 파일들**:
  - `frontend/src/app/week2/intro/page.js`
  - `frontend/src/app/week6/intro/page.js`
  - `frontend/src/app/week7/intro/page.js`
  - `frontend/src/app/week8/intro/page.js`
  - `frontend/src/app/week12/intro/page.js`
  - `frontend/src/app/week13/intro/page.js` (현재 없음 — page.js에서 backBtn이 /week13/intro를 가리키지만 해당 경로 없음!)
  - `frontend/src/app/week14/intro/page.js` (현재 없음 — 마찬가지로 backBtn이 가리키지만 없음)
  - `frontend/src/app/week15/intro/page.js`
- **참고**: `frontend/src/constants/curriculum.js`의 `introPath` 필드 확인 필요

### 3-2. 깨진 링크 수정 [P0]
- week13/page.js 70행: `router.push('/week13/intro')` → 해당 페이지 없음
- week14/page.js 70행: `router.push('/week14/intro')` → 해당 페이지 없음
- curriculum.js의 introPath들과 실제 파일 존재 여부 전수 확인 필요

### 3-3. Loss 함수 중복 제거 [P2]
- **중복 위치**:
  - `backend/server.js` (서버 물리 시뮬레이션)
  - `frontend/src/components/3d/LossSurface.jsx` (3D 지형 렌더링)
  - `frontend/src/app/week5/page.js` (솔로 모드 물리)
- **작업**: 프론트엔드 쪽은 `frontend/src/lib/lossFunction.js`로 추출하여 공유

### 3-4. Sidebar require 패턴 수정 [P2]
- **파일**: `frontend/src/components/layout/Sidebar.jsx`
- **현재**: `const Link = require('next/link').default` (런타임 require)
- **수정**: 정상적인 `import Link from 'next/link'`로 변경

---

## 📋 작업 순서 권장

### Phase 1: 기반 작업 (먼저)
1. ✅ 깨진 링크 수정 (3-2)
2. ✅ 인트로 템플릿 컴포넌트 생성 (2-1)
3. ✅ 반응형 기본 미디어 쿼리 추가 (2-2)

### Phase 2: 콘텐츠 개선 — P0 항목
4. Week 10 인트로 리뉴얼 (1-8)
5. Week 1 토크나이저 BPE 구체화 (1-1)
6. Week 6 뉴런 활성화 함수 그래프 (1-5)
7. Week 7 역전파 단계별 시각화 (1-6)
8. Week 13 아키텍처 텐서 흐름 (1-10)
9. Week 14 RLHF 시나리오 확장 (1-11)
10. Week 2 Temperature 시각화 강화 (1-2)

### Phase 3: 콘텐츠 개선 — P1 항목
11. Week 3 코사인 유사도 계산기 (1-3)
12. Week 5 파라미터 프리셋 (1-4)
13. Week 8 LSTM 게이트 시각화 (1-7)
14. Week 12 정규화 비교 (1-9)

### Phase 4: 인트로 페이지 일괄 생성
15. 누락된 인트로 페이지 8개 생성 (3-1)

### Phase 5: 디자인 마무리
16. 로딩/트랜지션 개선 (2-5)
17. 진행률 시각화 (2-3)
18. 인라인 스타일 정리 (2-6)

---

## 🗂️ 핵심 파일 참조 맵

```
frontend/src/
├── app/
│   ├── globals.css              ← 디자인 시스템 (CSS 변수, 애니메이션)
│   ├── layout.js                ← 루트 레이아웃
│   ├── page.js                  ← 로그인/홈
│   ├── hub/page.js              ← 미션 센터 (커리큘럼 그리드)
│   ├── dashboard/page.js        ← 교사 대시보드
│   ├── week1/
│   │   ├── intro/page.js        ← [수정] 인트로 확장
│   │   └── page.js              ← [수정] BPE 시각화 개선
│   ├── week2/
│   │   └── page.js              ← [수정] Temperature 시각화 강화
│   ├── week3/
│   │   ├── intro/page.js        ← [참고] 좋은 인트로 예시
│   │   └── page.js              ← [수정] 코사인 유사도 추가
│   ├── week5/
│   │   ├── intro/page.js        ← [참고] 좋은 인트로 예시
│   │   └── page.js              ← [수정] 프리셋, 발산 경고
│   ├── week6/page.js            ← [수정] 활성화 함수 그래프
│   ├── week7/page.js            ← [수정] 역전파 시각화
│   ├── week8/page.js            ← [수정] LSTM, PE 히트맵
│   ├── week10/
│   │   ├── intro/page.js        ← [수정] 단계별 인트로로 리뉴얼
│   │   └── page.js              ← [수정] Self-Attention 히트맵
│   ├── week12/page.js           ← [수정] 정규화 비교
│   ├── week13/page.js           ← [수정] 텐서 Shape 흐름
│   ├── week14/page.js           ← [수정] 시나리오 확장
│   └── week15/page.js           ← [수정] 아이디어 생성기
├── components/
│   ├── layout/
│   │   ├── ClientLayout.jsx
│   │   ├── Sidebar.jsx          ← [수정] require → import
│   │   └── IntroTemplate.jsx    ← [신규] 공통 인트로 템플릿
│   └── 3d/                      ← 3D 컴포넌트들 (현재 유지)
├── constants/
│   └── curriculum.js            ← 커리큘럼 메타데이터
├── stores/                      ← Zustand 스토어들
└── lib/
    ├── socket.js
    └── lossFunction.js          ← [신규] 공용 Loss 함수
```

---

## ⚠️ 작업 시 주의사항

1. **인라인 스타일 패턴 유지**: 현재 모든 파일이 `const styles = {...}` 패턴. 급하게 CSS 모듈로 전환하지 말고, 새 코드도 같은 패턴 사용 (Phase 5에서 일괄 전환)
2. **'use client' 필수**: 모든 페이지 컴포넌트 최상단에 `'use client'` 선언
3. **3D 컴포넌트는 dynamic import**: `next/dynamic`으로 `ssr: false` 설정 필수
4. **Socket.io 연결**: week3(임베딩), week5(레이싱), week10(어텐션)만 멀티플레이어. 나머지는 로컬 전용
5. **globals.css의 기존 클래스 활용**: `glass-card`, `btn-nova`, `input-cosmic`, `slider-cosmic` 등 이미 정의된 클래스 적극 활용
6. **CSS 변수**: `--bg-void`, `--accent-nova`, `--text-primary`, `--text-secondary`, `--text-dim` 등 사용

---

## 💡 열린 개선 정책

> 기존 계획에 없더라도, 작업 중 **교육적으로 더 도움이 되는 개선점**이 발견되면 적극 제안합니다.
> 제안 시 **왜 필요한지**, **어떻게 개선하면 좋을지**를 설명하고, 사용자와 상의 후 진행합니다.
> 채택된 제안은 이 섹션에 기록합니다.

### 추가 제안 기록

| # | 대상 | 제안 내용 | 상태 |
|---|------|----------|------|
| A-1 | — | (작업 진행 중 발견 시 추가) | — |

---

## ✅ 작업 진행 상황

### Phase 1: 기반 작업
1. ✅ 깨진 링크 수정 (3-2)
2. ✅ 인트로 페이지 전체 생성 (Phase 4 포함)
3. ❌ 인트로 템플릿 컴포넌트 생성 (2-1) — 미완 (각 인트로가 독립적으로 작동하여 우선순위 낮음)
4. ✅ 반응형 기본 미디어 쿼리 추가 (2-2) — 768px/480px/1200px 미디어 쿼리 완성

### Phase 2: 콘텐츠 개선 — P0
5. ✅ Week 10 인트로 리뉴얼 (1-8) — 6단계 인터랙티브 인트로 완성
6. ✅ Week 1 토크나이저 BPE 구체화 (1-1)
7. ✅ Week 6 뉴런 활성화 함수 그래프 (1-5)
8. ✅ Week 7 역전파 단계별 시각화 (1-6)
9. ✅ Week 13 아키텍처 텐서 흐름 (1-10)
10. ✅ Week 14 RLHF 시나리오 확장 (1-11) — 10개 시나리오, 레이더차트, DPO
11. ✅ Week 2 Temperature 시각화 강화 (1-2) — Top-k/Top-p, 자유 입력, Autoregressive 이론
12. ✅ Week 10 메인 랩 Self-Attention 히트맵 + Multi-Head Attention (1-8 메인)

### Phase 3: 콘텐츠 개선 — P1
13. ✅ Week 3 코사인 유사도 계산기 (1-3) — 프리셋 단어, 코사인/유클리드 거리, Word2Vec 설명
14. ✅ Week 5 파라미터 프리셋 + 발산 경고 (1-4) — 4개 프리셋, 발산 경고, Loss 차트, 옵티마이저 비교표
15. ✅ Week 8 LSTM 게이트 + PE 히트맵 (1-7) — 4탭 구성, LSTM 3게이트, PE 히트맵, RNN vs Transformer
16. ✅ Week 12 정규화 비교 시뮬레이션 (1-9) — 4탭: RMS/Norm비교/훈련시뮬/값폭발, 실제 LLM 깊이 비교

### Phase 5: 디자인 마무리
17. ✅ 반응형 CSS 미디어 쿼리 (2-2) — Phase 1에서 완료
18. ✅ 로딩/트랜지션 개선 (2-5) — ClientLayout 페이지 전환 fadeIn 애니메이션
19. ✅ 진행률 시각화 (2-3) — Hub 진행률 바+체크 버튼, Sidebar 프로그레스 바+완료 표시

### Phase 6: P2 보완 작업
20. ✅ Sidebar require → import 수정 (3-4) — require('next/link') → import Link
21. ✅ Week 15 해커톤 개선 (1-12) — 아이디어 생성기, 복습 체크리스트 11항목, 프롬프트 엔지니어링 4과제
22. ✅ Loss 함수 중복 제거 (3-3) — lib/lossFunction.js 공용 모듈 추출, LossSurface/week5에서 import
23. ✅ 다크/라이트 모드 (2-4) — globals.css 라이트 변수, ClientLayout 토글 버튼, localStorage 저장

### Phase 7: 리뷰 기반 개선
24. ✅ server.js 교사 인증 — TEACHER_PASSWORD 환경변수, join_dashboard 비밀번호 검증, teacher_command/start_race/reset_race 권한 체크
25. ✅ server.js 메모리 누수 수정 — 교사 disconnect 시 teacherId null + interval 정리, 빈 방 cleanup 개선
26. ✅ server.js 임베딩 좌표 개선 — WORD_CLUSTERS 6개 카테고리(동물/음식/감정/자연/기술/학교) 기반 의미적 좌표 배치
27. ✅ 소켓 커스텀 훅 생성 — lib/useSocketRoom.js (핸들러 참조 기반 정확한 cleanup, 자동 방 입장)
28. ✅ URL 접근 가드 훅 생성 — lib/useRequireRoom.js (roomCode 없으면 홈으로 리다이렉트)
29. ✅ 프로젝트 정리 — 루트 .gitignore 생성, backend/.env.example 생성, 미사용 page.module.css 삭제
30. ✅ 접근성(a11y) 개선 — :focus-visible 아웃라인, --text-dim 대비 강화(#8b84aa), skip-link, forced-colors, prefers-reduced-motion
31. ✅ 소켓 이벤트 리스너 정리 — week3/week5에서 socket.off() 호출 시 핸들러 참조 전달하도록 수정 (다른 컴포넌트 리스너 보존)

### Phase 8: Week 3-4 분리 & CSS 충돌 수정
32. ✅ Week 3-4 분리 — curriculum.js에서 '3-4' → '3'(원-핫 인코딩) + '4'(임베딩 은하수)로 분리
33. ✅ Week 3 랩 신규 작성 — 원-핫 인코딩 인터랙티브 랩 (4탭: 벡터빌더/거리비교/메모리계산기/인코딩비교)
34. ✅ Week 3 인트로 재작성 — 원-핫 인코딩 전용 6단계 인트로 (인코딩 필요성→개념→원-핫 데모→차원 폭발→거리 문제→실험실)
35. ✅ Week 4 디렉토리 생성 — 기존 week3의 3D 임베딩 은하수 랩을 week4로 이동
36. ✅ Week 4 인트로 신규 작성 — 임베딩 전용 5단계 인트로 (원-핫 한계 리캡→밀집 벡터→유사도→실제 모델→은하수 체험)
37. ✅ 참조 업데이트 — week15 REVIEW_ITEMS에서 '3-4' → '3'+'4' 분리
38. ✅ CSS shorthand 충돌 전수 수정 — border/borderColor 혼용으로 인한 React 경고를 14개 파일에서 border 단축형으로 통일

### Phase 9: GloVe 임베딩 통합 & 콘텐츠 WHY 보강
39. ✅ GloVe 벡터 추출 — Stanford GloVe (Wikipedia+Gigaword, 300D)에서 51개 단어 벡터를 `frontend/public/data/glove_vectors.json`(128.7KB)으로 추출. 14개 검증된 유추 예시 포함 (king-man+woman=queen, japan-tokyo+seoul=korea 등)
40. ✅ Week 4 코사인 유사도 실습 페이지 신규 생성 — `frontend/src/app/week4/practice/page.js` (3단계: 2D 벡터 → 3D 벡터 → 실제 GloVe 300D 벡터 연산). Canvas 2D로 드래그 가능한 벡터 시각화, 3D 회전 시각화, AI 편향 교육(doctor-man+woman=nurse 경고)
41. ✅ Week 4 네비게이션 업데이트 — intro → practice → galaxy 흐름으로 변경. 인트로 버튼 텍스트/경로 수정, 은하수 페이지에서 실습 페이지 링크 추가
42. ✅ 전체 콘텐츠 WHY/용어 설명 보강 (Week 1~15, ~60개 편집) — 주요 개선 내용:
    - Week 1: BPE WHY 동기 상자, 프롬프트/코퍼스/서브워드/UNK 한국어 정의, Token ID 설명
    - Week 2: Logit WHY, Temperature 물리 비유, Softmax 어원, 자기회귀 WHY, Greedy 한국어 설명
    - Week 3: 원-핫 어원, 벡터/차원/인덱스 정의, 희소 벡터 WHY, 유클리드 거리 설명
    - Week 5: Gradient descent WHY, Learning rate WHY, Loss function 개선, 옵티마이저 한국어 설명
    - Week 6: Activation function WHY (비선형 필요성), 각 함수 한국어 설명, Weight/Bias 설명
    - Week 7: Backpropagation WHY, 편미분 접근 가능 설명, Epoch/Loss 한국어 라벨
    - Week 8: RNN 제목 한국어화, Time Steps/Hidden State 설명, LSTM 수식 기호 설명, GRU 정의
    - Week 10: Q/K/V 한국어 직관 설명, Softmax/Self-Attention/K^T/Concat 설명
    - Week 12: Normalization WHY, CNN/Inference 정의, LayerNorm WHY, 수식 기호 설명
    - Week 13: vocab/MLP 설명, 한국어 라벨 추가, FFN 4x WHY, Weight tying 설명
    - Week 14: SFT WHY, Hallucination 한국어 정의, RM WHY, Base Model 정의
    - Week 15: 바이브 코딩 정의, Tech Stack/API/Serverless 한국어, BPE 리마인더, 프로토타입 정의

---

## 🔧 알려진 기술 부채 (Technical Debt)

| # | 파일 | 내용 | 우선순위 |
|---|------|------|---------|
| D-1 | `frontend/src/app/week4/page.js` | 구 VectorArithmeticPanel 데드 코드 ~180줄 (`__REMOVED__` 함수로 남아있음). 완전 삭제 필요 | P1 |
| D-2 | 전체 | 인라인 스타일 → CSS 모듈 전환 (2-6). 현재 모든 페이지가 `const styles = {...}` 패턴 | P2 |
| D-3 | — | 인트로 템플릿 컴포넌트 (2-1). 각 인트로가 독립적이라 우선순위 낮음 | P2 |

---

## 📝 남은 콘텐츠 리뷰 항목 (Phase 9에서 미처리)

Phase 9에서 전체 Week 1~15를 리뷰하여 ~170개 이슈를 발견, 그 중 ~60개 최우선 항목을 처리함.
아래는 남은 ~110개 하위 우선순위 항목의 대표 카테고리:

### 낮은 우선순위 (P2)
- **인트로 페이지 WHY 보강**: 각 주차 intro/page.js에도 동기 부여 설명 추가 (현재 메인 랩만 보강됨)
- **수학 수식 맥락 보충**: 일부 수식(특히 Week 7 체인룰, Week 10 어텐션 수식)에 "이 수식이 왜 이렇게 생겼는지" 직관적 설명 추가
- **더 상세한 유추 설명**: Week 5 경사하강법의 "골프 비유"나 Week 12 정규화의 "시험 점수 비유" 등을 더 풍부하게
- **영어 전문 용어 추가 정리**: 일부 용어(예: "latent space", "embedding dimension", "attention score")에 한국어 인라인 정의 추가
- **개념 간 브릿지 강화**: Week 간 연결고리 설명 (예: "Week 6에서 배운 뉴런이 Week 7에서 어떻게 학습하는지")

### 가능한 미래 개선 (P3)
- **한국어 토크나이저 예시 강화**: Week 1 BPE에서 한국어 자소 분리 과정 더 상세히
- **실제 GPT-2 토크나이저 비교**: tiktoken 라이브러리 결과와 우리 시뮬레이션 결과 비교
- **Week 14 RLHF 시나리오 다국어화**: 한국 사회 맥락에 맞는 윤리적 딜레마 추가

---

## 🎨 디자인 패턴 참조 (Design Patterns)

> 새로운 콘텐츠 작성 시 아래 패턴을 일관되게 사용할 것.

### 콘텐츠 박스 스타일
```javascript
// "한 걸음 더" 접이식 섹션 (보라색)
{ background: 'rgba(124, 92, 252, 0.06)', border: '1px solid rgba(124, 92, 252, 0.15)' }

// 브릿지 섹션 — 주차 간 연결 (금색)
{ background: 'rgba(251, 191, 36, 0.06)', border: '1px solid rgba(251, 191, 36, 0.15)' }

// 동기 부여 / WHY 섹션 (초록색)
{ background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.15)' }

// WHY 정보 박스 (금색, 위와 동일)
{ background: 'rgba(251, 191, 36, 0.06)', border: '1px solid rgba(251, 191, 36, 0.15)' }
```

### 인라인 용어 정의
```javascript
// 영어 용어에 한국어 설명을 붙일 때
<span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>(한국어 설명)</span>
```

### 주요 CSS 변수
- `--bg-void`: 배경색
- `--accent-nova`: 강조색 (보라)
- `--text-primary`: 주요 텍스트
- `--text-secondary`: 보조 텍스트
- `--text-dim`: 흐린 텍스트 (용어 정의용)

### 주요 CSS 클래스
- `glass-card`: 유리 효과 카드
- `btn-nova`: 주요 버튼
- `select-cosmic`: 드롭다운
- `input-cosmic`: 입력 필드
- `slider-cosmic`: 슬라이더

---

## 🗂️ 핵심 파일 참조 맵 (업데이트)

```
frontend/
├── public/
│   └── data/
│       └── glove_vectors.json     ← [Phase 9] 실제 GloVe 300D 벡터 51개 (128.7KB)
├── src/
│   ├── app/
│   │   ├── globals.css            ← 디자인 시스템 (CSS 변수, 애니메이션)
│   │   ├── layout.js              ← 루트 레이아웃
│   │   ├── page.js                ← 로그인/홈
│   │   ├── hub/page.js            ← 미션 센터 (커리큘럼 그리드)
│   │   ├── dashboard/page.js      ← 교사 대시보드
│   │   ├── week1/
│   │   │   ├── intro/page.js
│   │   │   └── page.js            ← [Phase 9] WHY/용어 보강
│   │   ├── week2/
│   │   │   └── page.js            ← [Phase 9] WHY/용어 보강
│   │   ├── week3/
│   │   │   ├── intro/page.js
│   │   │   └── page.js            ← [Phase 9] WHY/용어 보강
│   │   ├── week4/
│   │   │   ├── intro/page.js      ← [Phase 9] 네비게이션 업데이트
│   │   │   ├── practice/page.js   ← [Phase 9 신규] 2D→3D→300D 코사인 유사도 실습
│   │   │   └── page.js            ← [Phase 9] 데드 코드 정리 필요 (D-1)
│   │   ├── week5/page.js          ← [Phase 9] WHY/용어 보강
│   │   ├── week6/page.js          ← [Phase 9] WHY/용어 보강
│   │   ├── week7/page.js          ← [Phase 9] WHY/용어 보강
│   │   ├── week8/page.js          ← [Phase 9] WHY/용어 보강
│   │   ├── week10/page.js         ← [Phase 9] WHY/용어 보강
│   │   ├── week12/page.js         ← [Phase 9] WHY/용어 보강
│   │   ├── week13/page.js         ← [Phase 9] WHY/용어 보강
│   │   ├── week14/page.js         ← [Phase 9] WHY/용어 보강
│   │   └── week15/page.js         ← [Phase 9] WHY/용어 보강
│   ├── components/
│   │   ├── layout/
│   │   │   ├── ClientLayout.jsx
│   │   │   └── Sidebar.jsx
│   │   └── 3d/                    ← 3D 컴포넌트들
│   ├── constants/
│   │   └── curriculum.js          ← 커리큘럼 메타데이터
│   ├── stores/                    ← Zustand 스토어들
│   └── lib/
│       ├── socket.js
│       ├── lossFunction.js        ← 공용 Loss 함수
│       ├── useSocketRoom.js       ← 소켓 룸 커스텀 훅
│       └── useRequireRoom.js      ← URL 접근 가드 훅
backend/
├── server.js                      ← Express + Socket.io
└── .env.example                   ← 환경 변수 예시
```

---

## 🚀 다음 세션에서 시작하기

새 세션에서 다음과 같이 시작하세요:

```
IMPROVEMENT_PLAN.md 파일을 보고 작업을 이어서 진행해줘.
```

### 추천 다음 작업 (우선순위 순)

1. **D-1: week4/page.js 데드 코드 정리** — `__REMOVED__` 함수 ~180줄 완전 삭제 (5분)
2. **남은 콘텐츠 리뷰 항목 처리** — 인트로 페이지 WHY 보강, 수학 수식 맥락 보충
3. **Week 1 한국어 BPE 강화** — 자소 분리 과정 더 상세하게
4. **인라인 스타일 정리 (2-6)** — 공통 패턴을 globals.css 클래스로 추출

또는 특정 작업만 지정:

```
IMPROVEMENT_PLAN.md 파일을 보고, D-1 week4 데드 코드 정리를 진행해줘.
```
