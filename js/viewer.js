function getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        file: urlParams.get('file')
    };
}

// 뷰어 설정 로드
async function loadViewerConfig() {
    const response = await fetch('./properties/viewer-config.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
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
        console.error('Failed to load toc config:', error);
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
        console.error('Error checking auto toc setting:', error);
        return false;
    }
}

// GitHub raw 파일 로드
async function loadMarkdown(filePath) {
    const contentDiv = document.getElementById('content');

    try {
        // 먼저 main config를 로드해야 함
        await loadMainConfig('.');
        
        // 상대 경로 사용
        const fetchUrl = filePath;
        const response = await fetch(fetchUrl);

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
        // 자동 목차 생성
        await generateTableOfContents(contentDiv, markdown, filePath);
        // 제목 바로 아래에 문서 메타 정보(작성자 · 날짜) 삽입 (TOC가 있으면 TOC 위로 위치함)
        await insertDocumentMeta(contentDiv, filePath);
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

            // 상대 경로 사용
            if (originalSrc.startsWith('./')) {
                const relativePath = originalSrc.substring(2);
                newSrc = `${baseDir}/${relativePath}`;
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
                newSrc = pathParts.join('/');
            } else if (originalSrc.startsWith('/')) {
                newSrc = originalSrc.substring(1); // 절대 경로를 상대 경로로 변환
            } else {
                newSrc = `${baseDir}/${originalSrc}`;
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

    // TOC 헤딩과 매칭하되, 실패 시 순차적 매칭으로 폴백
    let unmatchedHeadings = [];
    
    // 첫 번째 시도: 정확한 텍스트와 레벨 매칭
    tocHeadings.forEach((tocHeading) => {
        let matched = false;
        // DOM에서 해당 텍스트를 가진 헤딩 요소 찾기
        for (let i = 0; i < actualHeadings.length; i++) {
            const element = actualHeadings[i];
            const elementText = element.textContent.trim();
            const expectedLevel = tocHeading.level;
            const actualLevel = parseInt(element.tagName.substring(1));
            
            // 텍스트와 레벨이 모두 일치하는 헤딩에 ID 할당
            if (elementText === tocHeading.text && actualLevel === expectedLevel && !element.id) {
                element.id = `toc-${tocIndex}`;
                tocIndex++;
                matched = true;
                break;
            }
        }
        
        // 매칭되지 않은 헤딩은 나중에 순차적으로 처리
        if (!matched) {
            unmatchedHeadings.push(tocHeading);
        }
    });
    
    // 두 번째 시도: 매칭되지 않은 헤딩들을 순차적으로 할당
    if (unmatchedHeadings.length > 0) {
        let availableHeadings = Array.from(actualHeadings).filter(h => !h.id);
        let fallbackIndex = 0;
        
        unmatchedHeadings.forEach((tocHeading) => {
            if (fallbackIndex < availableHeadings.length) {
                availableHeadings[fallbackIndex].id = `toc-${tocIndex}`;
                tocIndex++;
                fallbackIndex++;
            }
        });
    }

    // 메인 타이틀 다음에 목차 삽입 (문서 메타 정보는 별도로 삽입됨)
    if (mainTitle) {
        const firstHeading = contentDiv.querySelector('h1, h2');
        if (firstHeading) {
            firstHeading.insertAdjacentHTML('afterend', tocHtml);
        }
    }
}


// 문서 메타 정보 생성 (항상 표시, 라벨 제거)
async function generateDocumentMeta(filePath) {
    try {
        const config = await loadViewerConfig();
        const tocConfig = await loadTocConfig();

        // document_root 접두사 제거하여 toc.json의 path와 일치시키기
        const documentRoot = normalizePath(mainConfig.document_root);
        const relativePath = filePath.startsWith(documentRoot) ? filePath.substring(documentRoot.length) : filePath;

        // toc.json에서 현재 문서 항목 찾기
        let tocEntry = null;
        for (const [categoryKey, categoryInfo] of Object.entries(tocConfig)) {
            if (categoryInfo.files && Array.isArray(categoryInfo.files)) {
                const found = categoryInfo.files.find(f => f.path === relativePath);
                if (found) { tocEntry = found; break; }
            }
        }

        // 작성자: toc가 우선, 없으면 global_author
        const author = (tocEntry && tocEntry.author) ? tocEntry.author : (config.global_author || '');

        // 작성일: toc가 우선, 없으면 파일 수정일(TOC와 동일 포맷)
        let dateText = '';
        if (tocEntry && tocEntry.date) {
            const parsed = parseFlexibleDate(String(tocEntry.date));
            if (parsed) {
                dateText = formatDateLocale(parsed);
            } else {
                // 파싱 실패 시 원문 표시
                dateText = String(tocEntry.date);
            }
        } else {
            // toc에 지정이 없으면 getFileModifiedDate 사용 (TOC와 동일 소스)
            const modifiedDate = await getFileModifiedDate(relativePath);
            dateText = formatDateLocale(modifiedDate);
        }

        // 값 조합: "author  ·  date" (시각적으로 2배 간격 유지 위해 NBSP 사용)
        let line = '';
        if (author && dateText) {
            line = `${author}&nbsp;&nbsp;·&nbsp;&nbsp;${dateText}`;
        } else if (author) {
            line = author;
        } else {
            line = dateText; // author가 비어도 날짜는 표시
        }

        const metaHtml = `
            <div class="document-meta">${line}</div>
        `;

        return metaHtml;
    } catch (error) {
        console.error('Error generating document meta:', error);
        return null;
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
    const homeLabel = t('btn_home_viewer');

    contentDiv.innerHTML = `
        <div style="text-align: center; padding: 48px 24px;">
            <h2>${t('msg_error_load_document')}</h2>
            <p><strong>${t('lbl_file')}</strong> ${filePath}</p>
            <p><strong>${t('lbl_error')}</strong> ${errorMessage}</p>
            <br>
            <a href="/">${homeLabel} ${t('lbl_back')}</a>
        </div>
    `;
}

// 다크모드 상태 저장 및 토글
async function setDarkMode(on) {
    const config = await loadViewerConfig();

    // 전환 버튼 텍스트, class 처리 기존과 동일
    if (on) {
        document.body.classList.add('darkmode');
        sessionStorage.setItem('theme_mode', 'dark');
        const toggle = document.getElementById('darkmode-toggle');
        if (toggle) toggle.innerText = t('btn_light_mode');

        // 마크다운&하이라이트 다크 스타일 활성화
        document.getElementById('md-light').disabled = true;
        document.getElementById('md-dark').disabled = false;
        document.getElementById('highlight-light').disabled = true;
        document.getElementById('highlight-dark').disabled = false;

    } else {
        document.body.classList.remove('darkmode');
        sessionStorage.setItem('theme_mode', 'light');
        const toggle = document.getElementById('darkmode-toggle');
        if (toggle) toggle.innerText = t('btn_dark_mode');

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
        button.textContent = t('btn_home_viewer');
    });
}

// i18n 적용 함수
function applyI18nTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });
}

// 문서 메타 정보 삽입 함수 (제목 바로 아래, TOC 위)
async function insertDocumentMeta(contentDiv, filePath) {
    try {
        const firstHeading = contentDiv.querySelector('h1, h2');
        if (!firstHeading) return;
        const metaHtml = await generateDocumentMeta(filePath);
        if (metaHtml) {
            // 제목 바로 다음 위치에 삽입
            firstHeading.insertAdjacentHTML('afterend', metaHtml);
        }
    } catch (e) {
        console.error('Failed to insert document meta:', e);
    }
}

// 페이지 로드
document.addEventListener('DOMContentLoaded', async () => {
    const params = getUrlParameters();

    // 설정 로드 (viewer config 먼저 로드하여 locale 설정 확인)
    const config = await loadViewerConfig();
    await loadMainConfig('.');
    
    // Get locale from viewer config, fallback to 'ko' if not specified
    let locale = config.site_locale || 'ko';
    if (locale === 'default') {
        // Use browser language detection when set to 'default'
        locale = detectBrowserLanguage();
    }
    
    // Load i18n data with the configured locale
    await loadI18nData(locale);
    applyI18nTranslations();

    // 테마 토글 버튼 표시/숨김 처리
    const themeToggleBtn = document.getElementById('darkmode-toggle');
    if (themeToggleBtn) {
        if (config.show_theme_toggle) {
            themeToggleBtn.style.display = '';
        } else {
            themeToggleBtn.style.display = 'none';
        }
    }

    // 테마 설정 적용 (sessionStorage 우선, 없으면 config 기본값 사용)
    const sessionTheme = sessionStorage.getItem('theme_mode');
    let isDarkMode;
    
    if (sessionTheme) {
        // 세션에 저장된 테마가 있으면 사용
        isDarkMode = sessionTheme === 'dark';
    } else {
        // 세션에 저장된 테마가 없으면 config 기본값 사용
        isDarkMode = config.default_theme === 'dark';
    }

    await setDarkMode(isDarkMode);
    bindDarkModeButton();

    // 뷰어 라벨 적용
    await applyViewerConfigLabels();

    if (params.file) {
        loadMarkdown(params.file);
    } else {
        const homeLabel = t('btn_home_viewer');
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = `
            <div style="text-align: center; padding: 48px 24px;">
                <h2>${t('msg_error_no_file_path')}</h2>
                <p>${t('msg_error_provide_file_path')}</p>
                <br>
                <a href="/">${homeLabel} ${t('lbl_back')}</a>
            </div>
        `;
    }
});
