# Main Max: Fury Load 🚀

> 개발 문서 및 가이드 모음 - Jekyll 없는 순수 HTML/CSS/JavaScript 블로그

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://tansan5150.github.io)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## 🌟 특징

- **Jekyll 없는 순수 웹 기술**: HTML, CSS, JavaScript만으로 구현
- **GitHub Pages 호환**: `.nojekyll` 파일로 정적 사이트 호스팅
- **동적 마크다운 렌더링**: GitHub API를 통해 실시간으로 문서 로드
- **반응형 디자인**: 모든 기기에서 완벽하게 작동
- **깔끔한 코드 구조**: CSS와 JavaScript 파일 분리로 유지보수 용이

## 🎯 사이트 구조
```
tansan5150.github.io/
├── 📄 index.html          # 메인 페이지
├── 📄 viewer.html         # 마크다운 뷰어
├── 📁 css/
│   ├── main.css           # 메인 페이지 스타일
│   └── viewer.css         # 뷰어 페이지 스타일
├── 📁 js/
│   ├── main.js            # 메인 페이지 로직
│   └── viewer.js          # 뷰어 페이지 로직
├── 📁 posts/              # 마크다운 문서들
│   ├── 📁 md/             # Markdown 가이드
│   ├── 📁 vi/             # Vi/Vim 관련
│   ├── 📁 idea/           # IntelliJ IDEA
│   ├── 📁 spring-init/    # Spring 초기화
│   └── 📁 ... (기타 카테고리)
├── 📄 .nojekyll           # GitHub Pages 설정
├── 📄 .gitignore          # Git 무시 파일
└── 📄 README.md           # 이 파일
```


## 🚀 주요 기능

### 🔍 현재 지원 카테고리

| 아이콘 | 카테고리 | 설명 |
|--------|----------|------|
| 📝 | Markdown | 마크다운 문법 및 가이드 |
| ⌨️ | Vi/Vim | 텍스트 에디터 사용법 |
| 💡 | IntelliJ IDEA | IDE 설정 및 팁 |
| 🌱 | Spring Init | 스프링 프로젝트 초기화 |
| 🔐 | Certificate | 인증서 관련 |
| 🔄 | SVN | 버전 관리 시스템 |
| 📄 | SLText | 텍스트 처리 도구 |
| 🔗 | Swagger | API 문서화 |
| 🌐 | Git Server | Git 서버 설정 |
| ⚡ | Shortcuts | 단축키 모음 |

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **CSS Framework**: 없음 (순수 CSS)
- **JavaScript Libraries**: 
  - [marked.js](https://marked.js.org/) - 마크다운 파서
- **Hosting**: GitHub Pages
- **API**: GitHub REST API

## 📱 반응형 디자인

### 데스크톱 (1200px+)
- 3-4열 그리드 레이아웃
- 큰 폰트 사이즈 및 여백

### 태블릿 (768px - 1199px)
- 2-3열 그리드 레이아웃
- 적당한 폰트 사이즈

### 모바일 (768px 미만)
- 1열 세로 레이아웃
- 터치 친화적인 버튼 크기
- 축소된 헤더

## 🌐 라이브 사이트

**🔗 [tansan5150.github.io](https://tansan5150.github.io)**

## 📝 문서 추가 방법

1. `posts/` 디렉토리 내 적절한 카테고리 폴더에 `.md` 파일 추가
2. 파일을 GitHub에 커밋 및 푸시
3. 사이트가 자동으로 새 문서를 감지하여 표시

### 예시
```bash
# 새 마크다운 파일 추가
echo "# 새 문서 제목" > posts/md/new-document.md

# Git에 추가 및 커밋
git add posts/md/new-document.md
git commit -m "Add new document"
git push origin main
```

## 🎯 URL 구조

- **메인 페이지**: `/`
- **문서 뷰어**: `/viewer.html?file=posts/[category]/[filename].md`

### 예시 URL
```
https://tansan5150.github.io/viewer.html?file=posts/md/MarkDownGuide.md
```


## 🔧 로컬 개발

### 요구사항
- 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- 로컬 웹 서버 (선택사항)

### 실행 방법
```shell script
# 저장소 클론
git clone https://github.com/tansan5150/tansan5150.github.io.git
cd tansan5150.github.io

# 로컬 서버 실행 (Python 3 사용 예시)
python -m http.server 8000

# 브라우저에서 http://localhost:8000 접속
```


## 📊 성능 최적화

- **최소한의 HTTP 요청**: CDN 라이브러리 최소화
- **CSS/JS 분리**: 캐싱 효율성 증대
- **이미지 최적화**: 자동 크기 조정 및 압축
- **비동기 로딩**: GitHub API 비동기 처리

## 🤝 기여하기

1. Fork 이 저장소
2. 새 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 Creative Commons 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 확인하세요.

## 📞 연락처

- **GitHub**: [@tansan5150](https://github.com/tansan5150)
- **Website**: [tansan5150.github.io](https://tansan5150.github.io)

---

<div align="center">
  <p>Made by tansan5150</p>
  <p>
    <a href="https://tansan5150.github.io">Live Site</a> •
    <a href="https://github.com/tansan5150/tansan5150.github.io/issues">Report Bug</a> •
    <a href="https://github.com/tansan5150/tansan5150.github.io/issues">Request Feature</a>
  </p>
</div>

