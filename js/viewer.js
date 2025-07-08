// URL 파라미터에서 파일 경로 가져오기
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
            headerIds: true,  // 헤더 ID 생성 활성화
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

        // 헤더 ID 생성 및 목차 링크 처리
        processHeaders(contentDiv);
        
        // 기본 처리
        updateDocumentTitle(contentDiv);
        fixImagePaths(filePath);

    } catch (error) {
        console.error('Error loading markdown:', error);
        showError(contentDiv, filePath, error.message);
    }
}

// 헤더 ID 생성 및 목차 링크 처리
function processHeaders(contentDiv) {
    const headers = contentDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headers.forEach((header, index) => {
        const text = header.textContent.trim();
        
        // 숫자로 시작하는 헤더의 경우 숫자 추출
        const numberMatch = text.match(/^(\d+(?:\.\d+)*)/);
        if (numberMatch) {
            const number = numberMatch[1];
            // 점을 제거하고 ID 생성 (예: "1.1.1" -> "111")
            const id = number.replace(/\./g, '');
            header.id = id;
        } else {
            // 숫자가 없는 경우 기본 ID 생성
            let id = text.toLowerCase()
                .replace(/[^\w\s가-힣]/g, '')
                .replace(/\s+/g, '-')
                .replace(/--+/g, '-')
                .replace(/^-+|-+$/g, '');
                
            if (!id) {
                id = `header-${index}`;
            }
            header.id = id;
        }
    });
    
    // 목차 링크 클릭 시 부드러운 스크롤 처리
    contentDiv.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // URL 해시 업데이트
                history.pushState(null, null, `#${targetId}`);
            }
        });
    });
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
    if (on) {
        document.body.classList.add('darkmode');
        localStorage.setItem('md_darkmode', '1');
        const toggle = document.getElementById('darkmode-toggle');
        if (toggle) toggle.innerText = '☀️ 라이트모드';
    } else {
        document.body.classList.remove('darkmode');
        localStorage.setItem('md_darkmode', '0');
        const toggle = document.getElementById('darkmode-toggle');
        if (toggle) toggle.innerText = '🌙 다크모드';
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
    
    // 페이지 로드 시 해시가 있으면 해당 위치로 스크롤
    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }, 1000);
    }
});