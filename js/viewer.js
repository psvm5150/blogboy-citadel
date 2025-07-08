function getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        file: urlParams.get('file')
    };
}

// GitHub raw 파일 로드
async function loadMarkdown(filePath) {
    const contentDiv = document.getElementById('content');

    try {
        const response = await fetch(`https://raw.githubusercontent.com/tansan5150/tansan5150.github.io/main/${filePath}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const markdown = await response.text();
        
        // marked.js 설정 (GitHub 기본 설정)
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,  // 헤더 ID 생성 비활성화
            mangle: false,
            sanitize: false,
            pedantic: false,
            smartLists: true,
            smartypants: false
        });

        const html = marked.parse(markdown);
        contentDiv.innerHTML = `<div class="markdown-body">${html}</div>`;

        // 코드블록에 하이라이팅 적용
        document.querySelectorAll('.markdown-body pre code').forEach((el) => {
            hljs.highlightElement(el);
        });

        // 기본 처리
        updateDocumentTitle(contentDiv);
        fixImagePaths(filePath);

    } catch (error) {
        console.error('Error loading markdown:', error);
        showError(contentDiv, filePath, error.message);
    }
}

// 이미지 경로 수정
function fixImagePaths(filePath) {
    const images = document.querySelectorAll('.markdown-body img');
    const baseDir = filePath.substring(0, filePath.lastIndexOf('/'));
    
    images.forEach((img) => {
        const originalSrc = img.getAttribute('src');
        
        if (originalSrc && !originalSrc.startsWith('http://') && !originalSrc.startsWith('https://')) {
            let newSrc;
            
            if (originalSrc.startsWith('./')) {
                const relativePath = originalSrc.substring(2);
                newSrc = `https://raw.githubusercontent.com/tansan5150/tansan5150.github.io/main/${baseDir}/${relativePath}`;
            } else if (originalSrc.startsWith('../')) {
                const pathParts = baseDir.split('/');
                const relativeParts = originalSrc.split('/');
                
                for (const part of relativeParts) {
                    if (part === '..') {
                        pathParts.pop();
                    } else if (part !== '.') {
                        pathParts.push(part);
                    }
                }
                newSrc = `https://raw.githubusercontent.com/tansan5150/tansan5150.github.io/main/${pathParts.join('/')}`;
            } else if (originalSrc.startsWith('/')) {
                newSrc = `https://raw.githubusercontent.com/tansan5150/tansan5150.github.io/main${originalSrc}`;
            } else {
                newSrc = `https://raw.githubusercontent.com/tansan5150/tansan5150.github.io/main/${baseDir}/${originalSrc}`;
            }
            
            img.setAttribute('src', newSrc);
        }
    });
}

// 문서 제목 업데이트
function updateDocumentTitle(contentDiv) {
    const firstH1 = contentDiv.querySelector('h1');
    if (firstH1) {
        document.title = `${firstH1.textContent} - Main Max: Fury Load`;
    }
}

// 에러 표시
function showError(contentDiv, filePath, errorMessage) {
    contentDiv.innerHTML = `
        <div style="text-align: center; padding: 48px 24px;">
            <h2>❌ 문서를 불러올 수 없습니다</h2>
            <p><strong>파일:</strong> ${filePath}</p>
            <p><strong>오류:</strong> ${errorMessage}</p>
            <br>
            <a href="/">🏠 홈으로 돌아가기</a>
        </div>
    `;
}

// 다크모드 상태 저장 및 토글
function setDarkMode(on) {
    // 전환 버튼 텍스트, class 처리 기존과 동일
    if (on) {
        document.body.classList.add('darkmode');
        localStorage.setItem('md_darkmode', '1');
        const toggle = document.getElementById('darkmode-toggle');
        if (toggle) toggle.innerText = '☀️ 라이트모드';

        // 마크다운&하이라이트 다크 스타일 활성화
        document.getElementById('md-light').disabled = true;
        document.getElementById('md-dark').disabled = false;
        document.getElementById('highlight-light').disabled = true;
        document.getElementById('highlight-dark').disabled = false;

    } else {
        document.body.classList.remove('darkmode');
        localStorage.setItem('md_darkmode', '0');
        const toggle = document.getElementById('darkmode-toggle');
        if (toggle) toggle.innerText = '🌙 다크모드';

        // 무조건 라이트 스타일만 활성화
        document.getElementById('md-light').disabled = false;
        document.getElementById('md-dark').disabled = true;
        document.getElementById('highlight-light').disabled = false;
        document.getElementById('highlight-dark').disabled = true;
    }
}

function bindDarkModeButton() {
    const btn = document.getElementById('darkmode-toggle');
    if (!btn) return;
    btn.onclick = () => {
        setDarkMode(!document.body.classList.contains('darkmode'));
    };
}

// 페이지 로드
document.addEventListener('DOMContentLoaded', () => {
    const params = getUrlParameters();
    
    // 저장된 다크모드 선호도 반영
    if (localStorage.getItem('md_darkmode') === '1') {
        setDarkMode(true);
    } else {
        setDarkMode(false);
    }
    bindDarkModeButton();
    
    if (params.file) {
        loadMarkdown(params.file);
    } else {
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = `
            <div style="text-align: center; padding: 48px 24px;">
                <h2>❌ 파일 경로가 지정되지 않았습니다</h2>
                <p>올바른 파일 경로를 URL 파라미터로 제공해주세요.</p>
                <br>
                <a href="/">🏠 홈으로 돌아가기</a>
            </div>
        `;
    }
});