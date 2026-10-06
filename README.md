# 트롤 듀얼

노트북 2대, 팀당 2명 (트롤 + 어깨 위 고블린)이 겨루는 2:2 협동 대전 게임.

## 조작
- 트롤: WASD 이동, Space 근접 공격
- 고블린: 방향키 조준, `,` 파이어볼, `.` 저주(둔화)

## 로컬 실행 (같은 와이파이)
    npm install
    npm start
호스트는 http://localhost:3000, 상대 노트북은 터미널에 표시된 IP 주소로 접속.

## GitHub → 인터넷 배포 (Render, 무료)
1. 이 폴더를 GitHub 저장소에 올린다.
2. https://render.com 가입 후 New → Web Service → 해당 저장소 선택.
3. Build Command: `npm install` / Start Command: `npm start` / Plan: Free.
   (저장소에 render.yaml이 있어 Blueprint로도 배포 가능)
4. 배포가 끝나면 나오는 `https://xxxx.onrender.com` 주소를 두 노트북에서 열면 끝.

무료 플랜은 한동안 접속이 없으면 잠들어서, 첫 접속에 30초~1분 걸릴 수 있다.
