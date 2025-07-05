// URL 파라미터에서 파일 경로와 언어 가져오기
function getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        file: urlParams.get('file'),
        lang: urlParams.get('lang') || (typeof i18n !== 'undefined' ? i18n.getCurrentLanguage() : 'ko')
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
        
        // marked.js 설정 (GitHub 스타일에 맞게)
        marked.setOptions({
            breaks: true,           // GitHub 스타일 줄바꿈
            gfm: true,             // GitHub Flavored Markdown
            headerIds: true,       // 헤더 ID 자동 생성
            mangle: false,         // 헤더 ID 맹글링 비활성화
            sanitize: false        // HTML 허용 (주의: 신뢰할 수 있는 콘텐츠만)
        });

        const html = marked.parse(markdown);

        // GitHub 스타일 마크다운 컨테이너로 래핑
        contentDiv.innerHTML = `<div class="markdown-body">${html}</div>`;

        // 문서 제목 업데이트
        updateDocumentTitle(contentDiv);

        // 코드 블록 스타일링 향상
        enhanceCodeBlocks();

        // GitHub 스타일 alert 박스 처리
        processGitHubAlerts();

        // 테이블 반응형 처리
        makeTablesResponsive();

        // 링크 외부 열기 처리
        processExternalLinks();

    } catch (error) {
        console.error('Error loading markdown:', error);
        showError(contentDiv, filePath, error.message);
    }
}

// 문서 제목 업데이트
function updateDocumentTitle(contentDiv) {
    const firstH1 = contentDiv.querySelector('h1');
    if (firstH1) {
        const title = typeof i18n !== 'undefined' ? i18n.t('main.title') : 'Main Max: Fury Load';
        document.title = `${firstH1.textContent} - ${title}`;
    }
}

// 에러 표시
function showError(contentDiv, filePath, errorMessage) {
    const errorTitle = typeof i18n !== 'undefined' ? i18n.t('viewer.error.title') : '❌ 문서를 불러올 수 없습니다';
    const filePathLabel = typeof i18n !== 'undefined' ? i18n.t('viewer.error.file-path') : '파일 경로:';
    const errorLabel = typeof i18n !== 'undefined' ? i18n.t('viewer.error.message') : '오류:';
    const homeButton = typeof i18n !== 'undefined' ? i18n.t('viewer.home-button') : '홈으로 돌아가기';

    contentDiv.innerHTML = `
        <div class="error">
            <h2>${errorTitle}</h2>
            <p><strong>${filePathLabel}</strong> ${filePath}</p>
            <p><strong>${errorLabel}</strong> ${errorMessage}</p>
            <br>
            <a href="/" class="home-button">${homeButton}</a>
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
                    // [!NOTE] 텍스트 제거
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
            // 외부 링크는 새 탭에서 열기
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