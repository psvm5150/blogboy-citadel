'use strict';
function getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        file: urlParams.get('file')
    };
}

// 뷰어 설정 로드 (신구 구조 호환)
async function loadViewerConfig() {
    const raw = await fetchJsonCached('./properties/viewer-config.json');

    // Normalize to flat legacy fields for backward compatibility
    const normalized = { ...raw };

    // Header mappings
    const header = raw && typeof raw === 'object' ? raw.header || {} : {};
    if (header && typeof header === 'object') {
        if (header.title != null) normalized.page_title = String(header.title);
        // Accept new key show_colour_toggle (preferred), alias show_color_toggle, and legacy show_theme_toggle
        if (header.show_colour_toggle != null) {
            normalized.show_theme_toggle = !!header.show_colour_toggle;
        } else if (header.show_color_toggle != null) {
            normalized.show_theme_toggle = !!header.show_color_toggle;
        } else if (header.show_theme_toggle != null) {
            normalized.show_theme_toggle = !!header.show_theme_toggle;
        }
        if (header.default_theme != null) normalized.default_theme = String(header.default_theme);
    }

    // Viewer mappings
    const viewer = raw && typeof raw === 'object' ? raw.viewer || {} : {};
    if (viewer && typeof viewer === 'object') {
        if (viewer.author != null) normalized.author = String(viewer.author);
        if (viewer.show_table_of_contents != null) normalized.show_table_of_contents = !!viewer.show_table_of_contents;
        if (viewer.license_badge_image != null) normalized.license_badge_image = String(viewer.license_badge_image);
        if (viewer.license_badge_link != null) normalized.license_badge_link = String(viewer.license_badge_link);
        if (viewer.license_description != null) normalized.license_description = String(viewer.license_description);
        if (viewer.rss_feed_url != null) normalized.rss_feed_url = String(viewer.rss_feed_url);
    }

    // Adsense mappings (pass-through with defaults)
    const adsense = raw && typeof raw === 'object' ? raw.adsense || {} : {};
    if (adsense && typeof adsense === 'object') {
        normalized.adsense = {
            enabled: !!adsense.enabled,
            client_id: adsense.client_id ? String(adsense.client_id) : '',
            auto_ads: adsense.auto_ads !== false // default true
        };
    }

    // Footer mappings
    const footer = raw && typeof raw === 'object' ? raw.footer || {} : {};
    if (footer && typeof footer === 'object') {
        if (footer.copyright_text != null) normalized.copyright_text = String(footer.copyright_text);
    }

    // Fallbacks for site_locale remain at root
    if (normalized.site_locale == null && typeof raw.site_locale !== 'undefined') {
        normalized.site_locale = raw.site_locale;
    }

    return normalized;
}

// TOC 설정 로드
async function loadTocConfig() {
    try {
        return await fetchJsonCached('./properties/toc.json');
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

// 현재 문서의 disable_license_phrase 설정 확인
async function isLicensePhraseDisabled(filePath) {
    try {
        const tocConfig = await loadTocConfig();

        const documentRoot = normalizePath(mainConfig.document_root);
        const normalizedPath = filePath.startsWith(documentRoot) ? filePath.substring(documentRoot.length) : filePath;

        for (const [, categoryInfo] of Object.entries(tocConfig)) {
            if (categoryInfo.files && Array.isArray(categoryInfo.files)) {
                const file = categoryInfo.files.find(f => f.path === normalizedPath);
                if (file && file.disable_license_phrase === true) {
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking license phrase setting:', error);
        return false;
    }
}

// 최상단 setext 제목(===, ---) 감지: 문서의 첫 유의미 라인과 그 다음 라인으로 판단
function detectTopSetextTitle(markdown) {
    if (!markdown) return false;
    const lines = markdown.split('\n');
    let i = 0;
    // 첫 유의미(비공백) 라인 찾기
    while (i < lines.length && lines[i].trim() === '') i++;
    if (i >= lines.length - 1) return false;
    const titleCandidate = lines[i].trim();
    const underline = lines[i + 1].trim();
    // 제목 라인은 하이픈/이퀄만으로 이루어지면 안됨 (YAML front matter 등 방지)
    const isOnlyHyphensOrEquals = /^(=+|-+)$/.test(titleCandidate);
    if (!titleCandidate || isOnlyHyphensOrEquals) return false;
    // 바로 다음 라인이 = 또는 - 로만 구성되어야 함
    if (/^=+$/.test(underline) || /^-+$/.test(underline)) {
        return true;
    }
    return false;
}

// toc.json 에서 현재 파일의 제목 찾기
async function getTocTitleForFile(filePath) {
    try {
        const tocConfig = await loadTocConfig();
        const documentRoot = normalizePath(mainConfig.document_root);
        const relativePath = filePath.startsWith(documentRoot) ? filePath.substring(documentRoot.length) : filePath;
        for (const [, categoryInfo] of Object.entries(tocConfig)) {
            if (categoryInfo.files && Array.isArray(categoryInfo.files)) {
                const found = categoryInfo.files.find(f => f.path === relativePath);
                if (found && found.title) return String(found.title);
            }
        }
        return null;
    } catch (e) {
        console.error('Failed to get TOC title for file:', e);
        return null;
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

        // 필요 시 TOC 제목을 setext 형식으로 주입 (문서 최상단에 ===/--- 없을 때만)
        let finalMarkdown = markdown;
        if (!detectTopSetextTitle(markdown)) {
            const tocTitle = await getTocTitleForFile(filePath);
            if (tocTitle && tocTitle.trim()) {
                // === 스타일의 h1을 최상단에 삽입
                finalMarkdown = `${tocTitle}\n===================\n\n` + markdown;
            }
        }

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

        const html = marked.parse(finalMarkdown);
        contentDiv.innerHTML = `<div class="markdown-body">${html}</div>`;

        // 코드블록에 하이라이팅 적용
        document.querySelectorAll('.markdown-body pre code').forEach((el) => {
            hljs.highlightElement(el);
        });

        // 기본 처리
        await updateDocumentTitle(contentDiv);
        // 자동 목차 생성
        await generateTableOfContents(contentDiv, finalMarkdown, filePath);
        // 제목 바로 아래에 문서 메타 정보(작성자 · 날짜) 삽입 (TOC가 있으면 TOC 위로 위치함)
        await insertDocumentMeta(contentDiv, filePath);
        // 라이선스 정보 자동 표시 (자동 목차 아래, 없으면 작성자/작성일 아래) 및 본문 전 여백 처리
        await insertLicenseInfo(contentDiv, filePath);
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

        // 작성자: toc가 우선, 없으면 viewer-config의 author (호환 목적으로 global_author도 폴백)
        const author = (tocEntry && tocEntry.author) ? tocEntry.author : (config.author || config.global_author || '');

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

        // RSS 아이콘/링크: viewer-config.json 의 rss_feed_url 이 있으면 표시 (작성일 뒤, 공백 2칸)
        let rssHtml = '';
        const rssUrlRaw = config.rss_feed_url;
        if (rssUrlRaw && String(rssUrlRaw).trim() !== '') {
            let rssUrl = String(rssUrlRaw).trim();
            try {
                // 절대/상대 모두 허용
                const u = new URL(rssUrl, window.location.origin);
                rssUrl = u.pathname + u.search + u.hash || u.toString();
            } catch (e) {
                // URL 파싱 실패 시 그대로 사용
            }
            rssHtml = `&nbsp;&nbsp;<a class="rss-link" href="${rssUrl}" target="_blank" rel="noopener" title="RSS 구독">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style="vertical-align: -2px;">
                    <path d="M6.18 17.82A2.18 2.18 0 1 1 4 20a2.18 2.18 0 0 1 2.18-2.18M4 10.5a9.5 9.5 0 0 1 9.5 9.5h-3A6.5 6.5 0 0 0 4 13.5zm0-6A15.5 15.5 0 0 1 19.5 20h-3A12.5 12.5 0 0 0 4 7.5z"/>
                </svg>
                <span class="sr-only">RSS</span>
            </a>`;
        }

        const metaHtml = `
            <div class="document-meta">${line}${rssHtml}</div>
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

// 라이선스 정보 자동 삽입 및 본문 앞 여백 처리
// 규칙:
// - toc.json 에 disable_license_phrase=true 이면 라이선스 문구 표시 생략
// - viewer-config.json 에 라이선스 설정(배지 이미지 또는 설명)이 없으면 표시 생략
// - 라이선스 문구가 있는 경우: 라이선스 앞 1줄 공백(기존 유지) + 라이선스와 본문 사이 2줄 공백 추가
// - 라이선스 문구가 없는 경우: 자동목차가 있으면 TOC와 본문 사이 2줄 공백, 없으면 문서 메타와 본문 사이 2줄 공백
async function insertLicenseInfo(contentDiv, filePath) {
    try {
        const config = await loadViewerConfig();

        // 삽입 위치 기준 요소: TOC 우선, 없으면 문서 메타
        const tocEl = contentDiv.querySelector('.auto-toc');
        const metaEl = contentDiv.querySelector('.document-meta');
        const anchorEl = tocEl || metaEl;
        if (!anchorEl) {
            return; // 규칙상 TOC나 메타가 없으면 처리하지 않음
        }

        // toc.json 에서 비활성화 여부 확인
        const disabledByToc = await isLicensePhraseDisabled(filePath);

        // viewer-config 의 라이선스 유효성 검사 (배지 이미지 또는 설명 둘 중 하나라도 있으면 유효)
        const descRaw = config.license_description;
        const imgRaw = config.license_badge_image;
        const linkRaw = config.license_badge_link;
        const hasValidLicenseConfig = !((!descRaw || String(descRaw).trim() === '') && (!imgRaw || String(imgRaw).trim() === ''));

        // 헬퍼: 2줄 공백 삽입 (본문 시작 전 여백)
        const insertTwoBlankLines = (afterElement) => {
            if (!afterElement) return;
            afterElement.insertAdjacentHTML('afterend', '<br><br>');
        };

        // 라이선스 표시 조건 미충족일 때: 라이선스는 생략하고 2줄 여백만 추가
        if (disabledByToc || !hasValidLicenseConfig) {
            insertTwoBlankLines(anchorEl);
            return;
        }

        // 여기서부터 라이선스 표시 수행
        // 컨테이너 생성
        const container = document.createElement('div');
        container.className = 'license-info';

        let imgEl = null;
        let linkEl = null;

        // 이미지 URL 정규화 (http/https 아니면 normalizePath 사용)
        let imgUrl = null;
        if (imgRaw && String(imgRaw).trim() !== '') {
            const trimmed = String(imgRaw).trim();
            if (/^https?:\/\//i.test(trimmed)) {
                imgUrl = trimmed;
            } else {
                imgUrl = normalizePath(trimmed);
            }
        }

        if (imgUrl) {
            imgEl = document.createElement('img');
            imgEl.src = imgUrl;
            imgEl.alt = 'license-badge';
            imgEl.style.verticalAlign = 'middle';

            // 링크 유효성 검사 (없거나 유효하지 않으면 링크 없이 이미지 표시)
            let validLink = false;
            if (linkRaw && String(linkRaw).trim() !== '') {
                try {
                    // allow absolute and site-root/relative
                    const u = new URL(linkRaw, window.location.origin);
                    validLink = /^https?:/i.test(u.protocol) || linkRaw.startsWith('/') || linkRaw.startsWith('#');
                } catch (e) {
                    validLink = false;
                }
            }

            if (validLink) {
                linkEl = document.createElement('a');
                linkEl.href = linkRaw;
                linkEl.target = '_blank';
                linkEl.rel = 'noopener noreferrer';
                linkEl.appendChild(imgEl);
                container.appendChild(linkEl);
            } else {
                container.appendChild(imgEl);
            }

            // 이미지 로드 실패 시 이미지 및 링크 제거, 앞 공백 제거
            imgEl.addEventListener('error', () => {
                if (linkEl && linkEl.parentNode) {
                    linkEl.parentNode.removeChild(linkEl);
                } else if (imgEl && imgEl.parentNode) {
                    imgEl.parentNode.removeChild(imgEl);
                }
                const space = container.querySelector('.license-space');
                if (space) space.remove();
            });
        }

        // 설명 텍스트 추가
        const desc = descRaw ? String(descRaw) : '';
        if (desc.trim() !== '') {
            if (imgEl) {
                // 이미지가 있을 때만 공백 1칸 추가
                const space = document.createElement('span');
                space.className = 'license-space';
                space.textContent = ' ';
                container.appendChild(space);
            }
            container.appendChild(document.createTextNode(desc));
        }

        // 기존 기능 유지: 라이선스 앞 1줄 공백 + 라이선스 삽입
        anchorEl.insertAdjacentElement('afterend', container);
        container.insertAdjacentHTML('beforebegin', '<br>');

        // 본문 시작 전 2줄 여백 추가 (라이선스와 본문 사이)
        container.insertAdjacentHTML('afterend', '<br><br>');
    } catch (e) {
        console.error('Failed to insert license info:', e);
    }
}

// Google AdSense setup based on viewer-config.json
function setupAdSense(adsenseCfg) {
    try {
        if (!adsenseCfg || !adsenseCfg.enabled) return;
        const client = (adsenseCfg.client_id || '').trim();
        if (!client || !client.startsWith('ca-pub-')) return;

        // Prevent duplicate insertion
        if (document.getElementById('google-adsense-script')) return;

        const s = document.createElement('script');
        s.async = true;
        s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
        s.crossOrigin = 'anonymous';
        s.id = 'google-adsense-script';
        document.head.appendChild(s);
        // For Auto ads, including the script with client param is sufficient.
    } catch (e) {
        console.warn('Failed to setup AdSense:', e);
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

    // Setup Google AdSense if configured
    if (config.adsense) {
        setupAdSense(config.adsense);
    }

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
