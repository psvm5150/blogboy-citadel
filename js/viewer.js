// URL 파라미터에서 파일 경로와 언어 가져오기
function getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        file: urlParams.get('file'),
        lang: urlParams.get('lang') || 'ko'
    };
}

// GitHub의 raw 파일 URL로 마크다운 파일 가져오기
async function loadMarkdown(filePath) {
    const contentDiv = document.getElementById('content');

    try {
        const response = await fetch(`https://raw.githubusercontent.com/tansan5150/tansan5150.github.io/main/${filePath}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const markdown = await response.text();
        
        // marked.js 설정 (GitHub 완전 호환)
        marked.setOptions({
            breaks: true,           // GitHub 스타일 줄바꿈
            gfm: true,             // GitHub Flavored Markdown
            headerIds: true,       // 헤더 ID 자동 생성
            mangle: false,         // 헤더 ID 맹글링 비활성화
            sanitize: false,       // HTML 허용
            pedantic: false,       // GitHub 호환성
            smartLists: true,      // 스마트 리스트
            smartypants: false     // GitHub는 이 기능 사용 안함
        });

        const html = marked.parse(markdown);

        // GitHub 스타일 마크다운 컨테이너로 래핑
        contentDiv.innerHTML = `<div class="markdown-body">${html}</div>`;

        // 문서 제목 업데이트
        updateDocumentTitle(contentDiv);

        // 🔥 이미지 경로 수정 (가장 중요!)
        fixImagePaths(filePath);

        // 코드 블록 스타일링 향상
        enhanceCodeBlocks();

        // GitHub 스타일 alert 박스 처리
        processGitHubAlerts();

        // 테이블 반응형 처리
        makeTablesResponsive();

        // 링크 외부 열기 처리
        processExternalLinks();

        // GitHub 스타일 체크박스 처리
        processTaskLists();

    } catch (error) {
        console.error('Error loading markdown:', error);
        showError(contentDiv, filePath, error.message);
    }
}

// 🔥 이미지 경로 수정 함수 (핵심!)
function fixImagePaths(filePath) {
    const images = document.querySelectorAll('.markdown-body img');
    const baseDir = filePath.substring(0, filePath.lastIndexOf('/'));
    
    console.log('Fixing image paths for:', filePath);
    console.log('Base directory:', baseDir);
    
    images.forEach((img, index) => {
        const originalSrc = img.getAttribute('src');
        console.log(`Image ${index + 1} original src:`, originalSrc);
        
        if (originalSrc && !originalSrc.startsWith('http://') && !originalSrc.startsWith('https://')) {
            let newSrc;
            
            if (originalSrc.startsWith('./')) {
                // ./images/xxx.png → posts/spring-init/images/xxx.png
                const relativePath = originalSrc.substring(2);
                newSrc = `https://raw.githubusercontent.com/tansan5150/tansan5150.github.io/main/${baseDir}/${relativePath}`;
            } else if (originalSrc.startsWith('../')) {
                // ../images/xxx.png 처리
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
                // /posts/xxx/images/xxx.png
                newSrc = `https://raw.githubusercontent.com/tansan5150/tansan5150.github.io/main${originalSrc}`;
            } else {
                // images/xxx.png → posts/spring-init/images/xxx.png
                newSrc = `https://raw.githubusercontent.com/tansan5150/tansan5150.github.io/main/${baseDir}/${originalSrc}`;
            }
            
            console.log(`Image ${index + 1} new src:`, newSrc);
            img.setAttribute('src', newSrc);
            
            // 이미지 로드 실패 시 대체 처리
            img.onerror = function() {
                console.error('Failed to load image:', newSrc);
                this.style.display = 'none';
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'image-error';
                errorDiv.innerHTML = `
                    <div style="background: #fff8dc; border: 1px solid #d1ecf1; border-radius: 6px; padding: 16px; margin: 16px 0; text-align: center; color: #0c5460;">
                        📷 이미지를 불러올 수 없습니다<br>
                        <small style="color: #6c757d; font-size: 12px;">원본: ${originalSrc}</small><br>
                        <small style="color: #6c757d; font-size: 12px;">시도: ${newSrc}</small>
                    </div>
                `;
                this.parentNode.insertBefore(errorDiv, this);
            };
            
            // 이미지 로드 성공 시
            img.onload = function() {
                console.log(`Image loaded successfully:`, newSrc);
            };
        }
    });
}

// GitHub 스타일 체크박스 처리
function processTaskLists() {
    const listItems = document.querySelectorAll('.markdown-body li');
    listItems.forEach(li => {
        const text = li.innerHTML;
        if (text.includes('[ ]') || text.includes('[x]') || text.includes('[X]')) {
            li.classList.add('task-list-item');
            li.innerHTML = text
                .replace(/\[ \]/g, '<input type="checkbox" class="task-list-item-checkbox" disabled>')
                .replace(/\[x\]/gi, '<input type="checkbox" class="task-list-item-checkbox" checked disabled>');
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
        <div class="error">
            <h2>❌ 문서를 불러올 수 없습니다</h2>
            <p><strong>파일 경로:</strong> ${filePath}</p>
            <p><strong>오류:</strong> ${errorMessage}</p>
            <br>
            <a href="/" class="home-button">🏠 홈으로 돌아가기</a>
        </div>
    `;
}

// 코드 블록 스타일링 향상
function enhanceCodeBlocks() {
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
        // Highlight.js 적용
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(block);
        }

        // 언어 감지 및 표시
        const className = block.className;
        const languageMatch = className.match(/(?:^|\s)(?:language-|hljs\s+)([a-zA-Z0-9-]+)(?:\s|$)/);
        
        if (languageMatch) {
            const language = languageMatch[1];
            const pre = block.parentElement;
            pre.setAttribute('data-language', language);
        }
    });
}

// GitHub 스타일 alert 박스 처리
function processGitHubAlerts() {
    const alertPatterns = {
        'note': /^\[!NOTE\]/,
        'tip': /^\[!TIP\]/,
        'important': /^\[!IMPORTANT\]/,
        'warning': /^\[!WARNING\]/,
        'caution': /^\[!CAUTION\]/
    };

    const blockquotes = document.querySelectorAll('.markdown-body blockquote');
    blockquotes.forEach(blockquote => {
        const firstP = blockquote.querySelector('p');
        if (firstP) {
            const text = firstP.textContent.trim();
            
            for (const [type, pattern] of Object.entries(alertPatterns)) {
                if (pattern.test(text)) {
                    blockquote.classList.add('markdown-alert', `markdown-alert-${type}`);
                    firstP.textContent = text.replace(pattern, '').trim();
                    break;
                }
            }
        }
    });
}

// 테이블 반응형 처리
function makeTablesResponsive() {
    const tables = document.querySelectorAll('.markdown-body table');
    tables.forEach(table => {
        if (!table.parentElement.classList.contains('table-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';
            wrapper.style.overflowX = 'auto';
            wrapper.style.marginBottom = '16px';
            
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

// 외부 링크 처리
function processExternalLinks() {
    const links = document.querySelectorAll('.markdown-body a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

// 언어 선택기 초기화
function initializeLanguageSelector() {
    const container = document.getElementById('languageSelectorContainer');
    if (container && typeof i18n !== 'undefined') {
        container.innerHTML = i18n.createLanguageSelector();
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    const params = getUrlParameters();
    
    // URL 파라미터의 언어로 설정
    if (params.lang && typeof i18n !== 'undefined' && params.lang !== i18n.getCurrentLanguage()) {
        i18n.setLanguage(params.lang);
    }
    
    // 언어 선택기 초기화
    initializeLanguageSelector();
    
    if (params.file) {
        loadMarkdown(params.file);
    } else {
        const contentDiv = document.getElementById('content');
        const noFileTitle = typeof i18n !== 'undefined' ? i18n.t('viewer.error.no-file') : '❌ 파일 경로가 지정되지 않았습니다';
        const noFileDesc = typeof i18n !== 'undefined' ? i18n.t('viewer.error.no-file-desc') : '올바른 파일 경로를 URL 파라미터로 제공해주세요.';
        const homeButton = typeof i18n !== 'undefined' ? i18n.t('viewer.home-button') : '홈으로 돌아가기';
        
        contentDiv.innerHTML = `
            <div class="error">
                <h2>${noFileTitle}</h2>
                <p>${noFileDesc}</p>
                <br>
                <a href="/" class="home-button">${homeButton}</a>
            </div>
        `;
    }
});