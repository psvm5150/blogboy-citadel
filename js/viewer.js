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
        generateTableOfContents(contentDiv, markdown);
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

// 자동 목차 생성
function generateTableOfContents(contentDiv, markdown) {
    // 마크다운에서 헤딩 추출 (# 스타일과 underline 스타일 모두 지원)
    const headings = [];
    const lines = markdown.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

        // # 스타일 헤딩 처리
        const hashMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (hashMatch) {
            const level = hashMatch[1].length;
            const text = hashMatch[2].trim();

            // 첫 번째 # 또는 ## 헤딩을 찾으면 메인 타이틀로 처리
            if (headings.length === 0 && (level === 1 || level === 2)) {
                headings.push({
                    level: level,
                    text: text,
                    isMainTitle: true
                });
            } else {
                headings.push({
                    level: level,
                    text: text,
                    isMainTitle: false
                });
            }
        }
        // underline 스타일 헤딩 처리 (= 는 h1, - 는 h2)
        else if (line && nextLine) {
            if (nextLine.match(/^=+$/)) {
                // 첫 번째 underline 헤딩을 메인 타이틀로 처리
                if (headings.length === 0) {
                    headings.push({
                        level: 1,
                        text: line,
                        isMainTitle: true
                    });
                } else {
                    headings.push({
                        level: 1,
                        text: line,
                        isMainTitle: false
                    });
                }
            } else if (nextLine.match(/^-+$/)) {
                // 첫 번째 underline 헤딩을 메인 타이틀로 처리
                if (headings.length === 0) {
                    headings.push({
                        level: 2,
                        text: line,
                        isMainTitle: true
                    });
                } else {
                    headings.push({
                        level: 2,
                        text: line,
                        isMainTitle: false
                    });
                }
            }
        }
    }

    // 헤딩이 없거나 메인 타이틀만 있으면 목차 생성하지 않음
    if (headings.length <= 1) {
        return;
    }

    // 메인 타이틀 찾기
    const mainTitle = headings.find(h => h.isMainTitle);
    const tocHeadings = headings.filter(h => !h.isMainTitle);

    if (tocHeadings.length === 0) {
        return;
    }

    // 목차 HTML 생성
    let tocHtml = '<div class="auto-toc">';
    tocHtml += '<h3 class="toc-title">📋 목차</h3>';
    tocHtml += '<ul class="toc-list">';

    tocHeadings.forEach((heading, index) => {
        const anchorId = `toc-${index}`;
        const indent = Math.max(0, heading.level - 2); // h1,h2를 기준으로 들여쓰기
        const indentClass = indent > 0 ? ` toc-indent-${Math.min(indent, 4)}` : '';

        tocHtml += `<li class="toc-item${indentClass}">`;
        tocHtml += `<a href="#${anchorId}" class="toc-link">${heading.text}</a>`;
        tocHtml += '</li>';
    });

    tocHtml += '</ul></div>';

    // DOM에서 실제 헤딩 요소들에 ID 추가
    const actualHeadings = contentDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let tocIndex = 0;

    actualHeadings.forEach((element, index) => {
        // 첫 번째 h1 또는 h2는 메인 타이틀이므로 건너뛰기
        if (index === 0 && (element.tagName === 'H1' || element.tagName === 'H2')) {
            return;
        }

        if (tocIndex < tocHeadings.length) {
            element.id = `toc-${tocIndex}`;
            tocIndex++;
        }
    });

    // 메인 타이틀 다음에 목차 삽입
    if (mainTitle) {
        const firstHeading = contentDiv.querySelector('h1, h2');
        if (firstHeading) {
            firstHeading.insertAdjacentHTML('afterend', tocHtml);
        }
    }
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
