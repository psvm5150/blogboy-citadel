let mainConfig = {};

function getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        file: urlParams.get('file')
    };
}

// 경로 정규화 함수 - 다양한 형태의 경로를 일관된 형태로 변환
function normalizePath(path) {
    if (!path) return 'posts/';
    
    // 문자열로 변환
    path = String(path);
    
    // 앞뒤 공백 제거
    path = path.trim();
    
    // 빈 문자열이면 기본값 반환
    if (!path) return 'posts/';
    
    // "./" 시작 제거
    if (path.startsWith('./')) {
        path = path.substring(2);
    }
    
    // 시작 "/" 제거
    if (path.startsWith('/')) {
        path = path.substring(1);
    }
    
    // 파일명인지 확인 (확장자가 있는지 체크)
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(path);
    
    // 파일명이 아닌 경우에만 끝에 "/" 추가
    if (!hasExtension && !path.endsWith('/')) {
        path += '/';
    }
    
    return path;
}

// main-config.json 파일 로드
async function loadMainConfig() {
    try {
        const response = await fetch('./properties/main-config.json');
        if (!response.ok) {
            throw new Error(`Failed to load main-config.json: ${response.status}`);
        }
        mainConfig = await response.json();
        console.log('Main config loaded successfully in viewer');
    } catch (error) {
        console.warn('Failed to load main config in viewer, using defaults:', error);
        mainConfig = {
            site_title: "tansan5150.github.io",
            main_title: "Main Max: Fury Load",
            main_subtitle: "You will code eternal, shiny and RESTful!",
            site_url: "/",
            copyright_text: "© 2025 tansan5150.github.io. All rights reserved.",
            show_document_count: true,
            show_home_button: true,
            home_button_label: "🏠 홈",
            document_root: "posts/"
        };
    }
}

// 뷰어 설정 로드
async function loadViewerConfig() {
    try {
        const response = await fetch('./properties/viewer-config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.warn('Failed to load viewer config, using defaults:', error);
        return {
            show_table_of_contents: true,
            default_theme: "light",
            show_theme_toggle: true,
            page_title: "Main Max: Fury Load",
            copyright_text: "© 2025 tansan5150.github.io. All rights reserved.",
            home_button_label: "🏠 홈으로",
            dark_mode_button_label: "🌙 다크모드",
            light_mode_button_label: "☀️ 라이트모드"
        };
    }
}

// TOC 설정 로드
async function loadTocConfig() {
    try {
        const response = await fetch('./properties/toc.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.warn('Failed to load toc config:', error);
        return {};
    }
}

// 현재 문서의 disable_auto_toc 설정 확인
async function isAutoTocDisabled(filePath) {
    try {
        const tocConfig = await loadTocConfig();
        
        // document_root 접두사 제거
        const documentRoot = normalizePath(mainConfig.document_root);
        const normalizedPath = filePath.startsWith(documentRoot) ? filePath.substring(documentRoot.length) : filePath;
        
        // 모든 카테고리에서 해당 파일 찾기
        for (const [categoryKey, categoryInfo] of Object.entries(tocConfig)) {
            if (categoryInfo.files && Array.isArray(categoryInfo.files)) {
                const file = categoryInfo.files.find(f => f.path === normalizedPath);
                if (file && file.disable_auto_toc === true) {
                    return true;
                }
            }
        }
        
        return false;
    } catch (error) {
        console.warn('Error checking auto toc setting:', error);
        return false;
    }
}

// GitHub raw 파일 로드
async function loadMarkdown(filePath) {
    const contentDiv = document.getElementById('content');

    try {
        // 먼저 main config를 로드해야 함
        await loadMainConfig();
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
        await updateDocumentTitle(contentDiv);
        await generateTableOfContents(contentDiv, markdown, filePath);
        fixImagePaths(filePath);

    } catch (error) {
        console.error('Error loading markdown:', error);
        await showError(contentDiv, filePath, error.message);
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
async function generateTableOfContents(contentDiv, markdown, filePath) {
    // 설정 로드
    const config = await loadViewerConfig();

    // 목차 표시가 비활성화된 경우 생성하지 않음
    if (!config.show_table_of_contents) {
        return;
    }

    // 현재 문서의 disable_auto_toc 설정 확인
    if (await isAutoTocDisabled(filePath)) {
        return;
    }

    // 마크다운에서 헤딩 추출 (# 스타일과 underline 스타일 모두 지원)
    const headings = [];
    const lines = markdown.split('\n');
    let inCodeBlock = false;
    let inQuoteBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

        // 코드 블록 상태 확인
        if (trimmedLine.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            continue;
        }

        // 코드 블록 안에 있으면 헤딩 무시
        if (inCodeBlock) {
            continue;
        }

        // 인용구 블록 상태 확인 (> 로 시작하는 라인)
        inQuoteBlock = trimmedLine.startsWith('>');

        // 인용구 블록 안에 있으면 헤딩 무시
        if (inQuoteBlock) {
            continue;
        }

        // # 스타일 헤딩 처리 (오직 #, ##, ### 만 허용)
        const hashMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);
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
        else if (trimmedLine && nextLine) {
            if (nextLine.match(/^=+$/)) {
                // 첫 번째 underline 헤딩을 메인 타이틀로 처리
                if (headings.length === 0) {
                    headings.push({
                        level: 1,
                        text: trimmedLine,
                        isMainTitle: true
                    });
                } else {
                    headings.push({
                        level: 1,
                        text: trimmedLine,
                        isMainTitle: false
                    });
                }
            } else if (nextLine.match(/^-+$/)) {
                // 첫 번째 underline 헤딩을 메인 타이틀로 처리
                if (headings.length === 0) {
                    headings.push({
                        level: 2,
                        text: trimmedLine,
                        isMainTitle: true
                    });
                } else {
                    headings.push({
                        level: 2,
                        text: trimmedLine,
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
async function updateDocumentTitle(contentDiv) {
    const config = await loadViewerConfig();
    const firstH1 = contentDiv.querySelector('h1');
    if (firstH1) {
        document.title = `${firstH1.textContent} - ${config.page_title}`;
    }
}

// 에러 표시
async function showError(contentDiv, filePath, errorMessage) {
    const config = await loadViewerConfig();
    const homeLabel = config.home_button_label || "🏠 홈으로";

    contentDiv.innerHTML = `
        <div style="text-align: center; padding: 48px 24px;">
            <h2>❌ 문서를 불러올 수 없습니다</h2>
            <p><strong>파일:</strong> ${filePath}</p>
            <p><strong>오류:</strong> ${errorMessage}</p>
            <br>
            <a href="/">${homeLabel} 돌아가기</a>
        </div>
    `;
}

// 다크모드 상태 저장 및 토글
async function setDarkMode(on) {
    const config = await loadViewerConfig();

    // 전환 버튼 텍스트, class 처리 기존과 동일
    if (on) {
        document.body.classList.add('darkmode');
        localStorage.setItem('md_darkmode', '1');
        const toggle = document.getElementById('darkmode-toggle');
        if (toggle) toggle.innerText = config.light_mode_button_label || '☀️ 라이트모드';

        // 마크다운&하이라이트 다크 스타일 활성화
        document.getElementById('md-light').disabled = true;
        document.getElementById('md-dark').disabled = false;
        document.getElementById('highlight-light').disabled = true;
        document.getElementById('highlight-dark').disabled = false;

    } else {
        document.body.classList.remove('darkmode');
        localStorage.setItem('md_darkmode', '0');
        const toggle = document.getElementById('darkmode-toggle');
        if (toggle) toggle.innerText = config.dark_mode_button_label || '🌙 다크모드';

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

// 뷰어 페이지 라벨 적용
async function applyViewerConfigLabels() {
    const config = await loadViewerConfig();

    // 문서 타이틀
    document.title = config.page_title;

    // 헤더 제목
    const headerTitle = document.querySelector('.header h1');
    if (headerTitle) {
        headerTitle.textContent = config.page_title;
    }

    // 저작권 텍스트
    const copyrightText = document.querySelector('.footer p');
    if (copyrightText) {
        copyrightText.textContent = config.copyright_text;
    }

    // 홈 버튼 라벨 (헤더와 푸터 모두)
    const homeButtons = document.querySelectorAll('.home-button');
    homeButtons.forEach(button => {
        if (config.home_button_label) {
            button.textContent = config.home_button_label;
        }
    });
}

// 페이지 로드
document.addEventListener('DOMContentLoaded', async () => {
    const params = getUrlParameters();

    // 설정 로드 (main config와 viewer config 모두)
    await loadMainConfig();
    const config = await loadViewerConfig();

    // 테마 토글 버튼 표시/숨김 처리
    const themeToggleBtn = document.getElementById('darkmode-toggle');
    if (themeToggleBtn) {
        if (config.show_theme_toggle) {
            themeToggleBtn.style.display = '';
        } else {
            themeToggleBtn.style.display = 'none';
        }
    }

    // 테마 설정 적용 (localStorage 우선, 없으면 config 기본값 사용)
    const savedTheme = localStorage.getItem('md_darkmode');
    let isDarkMode;

    if (savedTheme !== null) {
        // 저장된 설정이 있으면 우선 사용
        isDarkMode = savedTheme === '1';
    } else {
        // 저장된 설정이 없으면 config의 기본값 사용
        isDarkMode = config.default_theme === 'dark';
    }

    await setDarkMode(isDarkMode);
    bindDarkModeButton();

    // 뷰어 라벨 적용
    await applyViewerConfigLabels();

    if (params.file) {
        loadMarkdown(params.file);
    } else {
        const homeLabel = config.home_button_label || "🏠 홈으로";
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = `
            <div style="text-align: center; padding: 48px 24px;">
                <h2>❌ 파일 경로가 지정되지 않았습니다</h2>
                <p>올바른 파일 경로를 URL 파라미터로 제공해주세요.</p>
                <br>
                <a href="/">${homeLabel} 돌아가기</a>
            </div>
        `;
    }
});
