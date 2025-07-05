// URL 파라미터에서 파일 경로 가져오기
function getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        file: urlParams.get('file')
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

        // 목차 생성 (선택사항)
        generateTableOfContents();

        console.log('✅ 문서 로드 완료:', filePath);

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
                console.log(`✅ Image loaded successfully:`, newSrc);
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
        <div class="error" style="text-align: center; padding: 48px 24px; color: #24292f;">
            <h2 style="color: #cf222e; margin-bottom: 16px;">❌ 문서를 불러올 수 없습니다</h2>
            <p style="margin-bottom: 8px;"><strong>파일 경로:</strong> <code>${filePath}</code></p>
            <p style="margin-bottom: 32px;"><strong>오류:</strong> ${errorMessage}</p>
            <a href="/" class="home-button" style="display: inline-block; background: #238636; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                🏠 홈으로 돌아가기
            </a>
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
            
            // 언어 라벨 추가
            if (!pre.querySelector('.code-language')) {
                const label = document.createElement('div');
                label.className = 'code-language';
                label.textContent = language;
                label.style.cssText = `
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: rgba(0,0,0,0.1);
                    color: #656d76;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 12px;
                    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
                `;
                pre.style.position = 'relative';
                pre.appendChild(label);
            }
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
            wrapper.style.cssText = `
                overflow-x: auto;
                margin-bottom: 16px;
                border: 1px solid #d0d7de;
                border-radius: 6px;
            `;
            
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
            
            // 외부 링크 아이콘 추가
            if (!link.querySelector('.external-link-icon')) {
                const icon = document.createElement('span');
                icon.className = 'external-link-icon';
                icon.innerHTML = ' ↗';
                icon.style.cssText = `
                    color: #656d76;
                    font-size: 0.8em;
                    margin-left: 2px;
                `;
                link.appendChild(icon);
            }
        }
    });
}

// 목차 생성 (옵션)
function generateTableOfContents() {
    const headings = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6');
    
    if (headings.length > 3) { // 헤딩이 3개 이상일 때만 목차 생성
        const toc = document.createElement('div');
        toc.className = 'table-of-contents';
        toc.style.cssText = `
            background: #f6f8fa;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
            position: relative;
        `;
        
        let tocHTML = '<h4 style="margin-top: 0; color: #24292f;">📋 목차</h4><ul style="margin-bottom: 0; padding-left: 20px;">';
        
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.substring(1));
            const text = heading.textContent;
            const id = `heading-${index}`;
            heading.id = id;
            
            const indent = (level - 1) * 16;
            tocHTML += `<li style="margin-left: ${indent}px; margin-bottom: 4px;"><a href="#${id}" style="text-decoration: none; color: #0969da;">${text}</a></li>`;
        });
        
        tocHTML += '</ul>';
        toc.innerHTML = tocHTML;
        
        // 첫 번째 헤딩 앞에 목차 삽입
        const firstHeading = headings[0];
        firstHeading.parentNode.insertBefore(toc, firstHeading);
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    const params = getUrlParameters();
    
    if (params.file) {
        console.log('📖 로딩 중:', params.file);
        loadMarkdown(params.file);
    } else {
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = `
            <div class="error" style="text-align: center; padding: 48px 24px; color: #24292f;">
                <h2 style="color: #cf222e; margin-bottom: 16px;">❌ 파일 경로가 지정되지 않았습니다</h2>
                <p style="margin-bottom: 32px;">올바른 파일 경로를 URL 파라미터로 제공해주세요.</p>
                <a href="/" class="home-button" style="display: inline-block; background: #238636; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                    🏠 홈으로 돌아가기
                </a>
            </div>
        `;
    }
});

// 스크롤 시 헤더 그림자 효과
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 10) {
        header.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    } else {
        header.style.boxShadow = 'none';
    }
});