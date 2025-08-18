'use strict';
let documentCategories = {};
let currentViewMode = 'category'; // Default value, will be changed during initialization based on settings

// Pagination/Search state
let currentPage = 1;
let currentSearchTerm = '';
function getPerPage() {
    const n = Number(mainConfig.documents_per_page);
    return Number.isFinite(n) && n > 0 ? n : 20;
}

// Flatten all docs once TOC is loaded
function buildAllDocsFlat() {
    const all = [];
    for (const [, categoryInfo] of Object.entries(documentCategories)) {
        if (categoryInfo.files && categoryInfo.files.length > 0) {
            categoryInfo.files.forEach(file => {
                const tocDate = file && file.date ? parseFlexibleDate(String(file.date)) : null;
                all.push({
                    file,
                    categoryTitle: categoryInfo.title,
                    tocDate,
                    sortDate: tocDate || new Date('1970-01-01')
                });
            });
        }
    }
    // For All view and search, keep newest first by tocDate if available
    all.sort((a, b) => b.sortDate - a.sortDate);
    return all;
}

// toc.json 파일 로드
async function loadToc() {
    try {
        documentCategories = await fetchJsonCached('properties/toc.json');
        console.log('TOC loaded successfully');
    } catch (error) {
        console.error('Error loading TOC:', error);
        throw error;
    }
}

// 문서 목록 로드
async function loadDocuments() {
    const postsContainer = document.getElementById('postsContainer');

    if (!postsContainer) {
        console.error('postsContainer element not found');
        return;
    }

    try {
        await loadToc();

        // default_view_filter 설정에 따라 초기 뷰 모드 설정
        if (mainConfig.default_view_filter === 'all') {
            currentViewMode = 'all';
        } else {
            currentViewMode = 'category';
        }

        currentPage = 1;
        currentSearchTerm = '';
        await renderDocuments();

    } catch (error) {
        console.error('Error loading documents:', error);
        postsContainer.innerHTML = `<div class="loading">${t('msg_failed_load_documents')}</div>`;
    }
}

// 현재 뷰 모드 + 검색어에 따라 문서 렌더링 (페이징 포함)
async function renderDocuments() {
    const postsContainer = document.getElementById('postsContainer');
    const pager = document.getElementById('pagination');

    if (!postsContainer) return;

    postsContainer.innerHTML = `<div class="loading">${t('msg_loading_documents')}</div>`;

    try {
        const perPage = getPerPage();
        const allFlat = buildAllDocsFlat();

        // Enrich missing dates for proper sorting in All/Search view (use file modified date when toc date is absent)
        const enriched = await Promise.all(allFlat.map(async (it) => {
            if (!it.tocDate) {
                const md = await getFileModifiedDate(it.file.path);
                if (md && md instanceof Date && !isNaN(md.getTime())) {
                    it.sortDate = md;
                }
            }
            return it;
        }));
        // Ensure newest first sort
        enriched.sort((a, b) => b.sortDate - a.sortDate);

        // 필터링: 검색어가 있으면 전체 영역에서 검색
        const term = (currentSearchTerm || '').trim().toLowerCase();
        let filtered = term
            ? enriched.filter(it => (it.file.title || '').toLowerCase().includes(term) || (it.categoryTitle || '').toLowerCase().includes(term))
            : enriched;

        // Update body data attribute to reflect current view for responsive CSS rules
        try {
            const viewModeForCss = term ? 'search' : currentViewMode;
            document.body.setAttribute('data-view', viewModeForCss);
        } catch (e) { /* ignore */ }

        // 표시 모드에 따른 그룹화 / 섹션 타이틀
        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const start = (currentPage - 1) * perPage;
        const pageSlice = filtered.slice(start, start + perPage);

        let html = '';
        if (term || currentViewMode === 'all') {
            // 검색 결과 또는 전체보기는 단일 섹션으로 렌더링 (카테고리 배지 표시)
            html = await createFlatListSection(term ? `🔎 ${t('lbl_search_result')}` : t('lbl_all_documents'), pageSlice);
        } else {
            // 분류보기: 페이지 조각을 카테고리별로 묶어 섹션 렌더링
            const grouped = new Map();
            for (const item of pageSlice) {
                if (!grouped.has(item.categoryTitle)) grouped.set(item.categoryTitle, []);
                grouped.get(item.categoryTitle).push(item.file);
            }
            const sectionPromises = [];
            grouped.forEach((files, title) => sectionPromises.push(createCategorySection(title, files)));
            const sections = await Promise.all(sectionPromises);
            html = sections.join('');
        }

        if (!html) {
            postsContainer.innerHTML = `<div class="loading">${t('msg_no_documents')}</div>`;
        } else {
            postsContainer.innerHTML = html;
        }

        renderPaginationControls(pager, totalItems, currentPage, totalPages);

        console.log(`Rendered ${Math.min(perPage, totalItems)} of ${totalItems} items (page ${currentPage}/${totalPages}) in ${term ? 'search' : currentViewMode} mode`);
    } catch (error) {
        console.error('Error rendering documents:', error);
        postsContainer.innerHTML = `<div class="loading">${t('msg_failed_render_documents')}</div>`;
    }
}


// 파일이 "new" 표시를 받을지 확인하는 함수
// dateOverride가 주어지면 네트워크 호출 없이 해당 날짜를 사용
async function shouldShowNewIndicator(filePath, dateOverride = null) {
    if (!mainConfig.show_new_indicator) {
        return false;
    }
    
    const baseDate = dateOverride instanceof Date && !isNaN(dateOverride.getTime())
        ? dateOverride
        : await getFileModifiedDate(filePath);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate - baseDate) / (1000 * 60 * 60 * 24));
    
    return daysDiff <= mainConfig.new_display_days;
}

// 문서 날짜 표시 HTML 생성 (날짜만 표시 - 시간 제거)
function createDateTimeDisplay(dateObj) {
    if (!mainConfig.show_document_date || !dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime()) || dateObj.getTime() <= new Date('1970-01-01').getTime()) {
        return '';
    }
    const formattedDate = formatDateLocale(dateObj);
    return `<span class="new-datetime">${formattedDate}</span>`;
}

// "new" 표시 HTML 생성
function createNewIndicator() {
    return `<span class="new-indicator">${t('lbl_new_indicator')}</span>`;
}

// 카테고리 섹션 생성
async function createCategorySection(title, files) {
    const documentRoot = normalizePath(mainConfig.document_root);

    // 각 파일에 대해 비동기적으로 new indicator 및 날짜 확인 (네트워크 호출 최소화)
    const fileListPromises = files.map(async (file) => {
        // 우선 toc의 날짜를 파싱해 둔다
        const tocDate = file && file.date ? parseFlexibleDate(String(file.date)) : null;

        // 필요할 때만 수정일 조회 (캐시됨)
        let modifiedDate = null;
        const needAnyDate = !!mainConfig.show_document_date || !!mainConfig.show_new_indicator;
        if (!tocDate && needAnyDate) {
            modifiedDate = await getFileModifiedDate(file.path);
        }

        // NEW 여부는 tocDate가 있으면 그걸로 판정, 없으면 수정일로 판정
        const baseForNew = tocDate || modifiedDate;
        const showNew = baseForNew ? await shouldShowNewIndicator(file.path, baseForNew) : false;
        const newIndicator = showNew ? createNewIndicator() : '';

        // 날짜 표시: 설정 ON이면 tocDate 우선, 없으면 수정일 사용
        const displayDate = mainConfig.show_document_date ? (tocDate || modifiedDate) : null;
        const dateTimeDisplay = createDateTimeDisplay(displayDate);

        return `
            <li class="post-item">
                <a href="viewer.html?file=${documentRoot}${file.path}" class="post-link">
                    <span class="post-title">${file.title}</span>${newIndicator}${dateTimeDisplay}
                </a>
            </li>
        `;
    });
    
    const fileListArray = await Promise.all(fileListPromises);
    const fileList = fileListArray.join('');

    const countDisplay = mainConfig.show_document_count ? 
        `<span class="category-count">${files.length} ${t('lbl_document_count')}</span>` : '';

    return `
        <div class="category-section">
            <div class="category-header">
                <div class="category-title">
                    <span class="category-title-text">${title}</span>
                    ${countDisplay}
                </div>
            </div>
            <div class="category-body">
                <ul class="post-list">
                    ${fileList}
                </ul>
            </div>
        </div>
    `;
}

// Flat list section renderer for All/Search view (expects slice of flattened items)
async function createFlatListSection(titleText, flattenedItems) {
    const documentRoot = normalizePath(mainConfig.document_root);

    const fileListPromises = flattenedItems.map(async (wrap) => {
        const file = wrap.file;
        // Use tocDate if available, otherwise fallback to file modified date to match category view behavior
        const baseDate = wrap.tocDate || await getFileModifiedDate(file.path);
        const showNew = baseDate ? await shouldShowNewIndicator(file.path, baseDate) : false;
        const newIndicator = showNew ? createNewIndicator() : '';
        const displayDate = mainConfig.show_document_date ? baseDate : null;
        const dateTimeDisplay = createDateTimeDisplay(displayDate);
        const categoryName = `<span class="category-name">${wrap.categoryTitle}</span>`;
        return `
            <li class="post-item">
                <a href="viewer.html?file=${documentRoot}${file.path}" class="post-link">
                    <span class="post-title">${file.title}</span>${newIndicator}${dateTimeDisplay}${categoryName}
                </a>
            </li>
        `;
    });

    const fileListArray = await Promise.all(fileListPromises);
    const fileList = fileListArray.join('');
    const countDisplay = '';

    return `
        <div class="category-section">
            <div class="category-header">
                <div class="category-title">${titleText}</div>
                ${countDisplay}
            </div>
            <div class="category-body">
                <ul class="post-list">
                    ${fileList}
                </ul>
            </div>
        </div>
    `;
}


// 검색 기능
function renderPaginationControls(pager, totalItems, current, totalPages) {
    if (!pager) return;
    if (totalItems === 0) { pager.innerHTML = ''; return; }
    const prevDisabled = current <= 1 ? 'disabled' : '';
    const nextDisabled = current >= totalPages ? 'disabled' : '';

    const pageInfo = t('lbl_page_info', { current, total: totalPages });
    pager.innerHTML = `
        <button id="btnPrevPage" ${prevDisabled}>${t('btn_prev_page')}</button>
        <span class="page-info">${pageInfo}</span>
        <button id="btnNextPage" ${nextDisabled}>${t('btn_next_page')}</button>
    `;

    const prev = document.getElementById('btnPrevPage');
    const next = document.getElementById('btnNextPage');
    if (prev) prev.onclick = async () => { if (currentPage > 1) { currentPage--; await renderDocuments(); restoreSearchInput(); } };
    if (next) next.onclick = async () => { currentPage++; await renderDocuments(); restoreSearchInput(); };
}

function restoreSearchInput() {
    const input = document.getElementById('documentSearch');
    if (input && input.value !== currentSearchTerm) {
        input.value = currentSearchTerm;
    }
}

function initializeSearch() {
    const searchContainer = document.querySelector('.main-content .container');

    if (searchContainer) {
        const searchHTML = `
            <div class="search-container">
                <input type="text" id="documentSearch" placeholder="${t('lbl_document_search')}">
            </div>
        `;

        const contentWrapper = document.querySelector('.content-wrapper');
        contentWrapper.insertAdjacentHTML('beforebegin', searchHTML);

        // 검색 통계를 view-controls에 추가
        const viewControls = document.querySelector('.view-controls');
        if (viewControls) {
            const searchStatsHTML = `<div id="searchStats" style="font-size: 14px; color: #656d76; margin-right: 16px; align-self: center;"></div>`;
            viewControls.insertAdjacentHTML('afterbegin', searchStatsHTML);
        }

        const searchInput = document.getElementById('documentSearch');
        searchInput.addEventListener('input', handleSearch);

        updateSearchStats();
    }
}

// 검색 처리
function handleSearch(event) {
    currentSearchTerm = (event.target.value || '').trim();
    currentPage = 1;
    updateSearchStats(currentSearchTerm);
    renderDocuments();
}

// 검색 통계 업데이트
function updateSearchStats(searchTerm = '') {
    const searchStats = document.getElementById('searchStats');
    if (!searchStats) return;

    const allFlat = buildAllDocsFlat();
    const totalDocs = allFlat.length;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matched = allFlat.filter(it => (it.file.title || '').toLowerCase().includes(term) || (it.categoryTitle || '').toLowerCase().includes(term)).length;
        searchStats.textContent = `"${searchTerm}" ${t('lbl_search_result')}: ${matched} ${t('lbl_document_count')}`;
    } else {
        // categories count
        const categoriesCount = Object.keys(documentCategories).length;
        searchStats.textContent = t('lbl_total_documents', {
            count: totalDocs,
            categories: categoriesCount
        });
    }
}

// 메인 페이지 라벨 적용
function applyMainConfigLabels() {
    // 문서 타이틀 (i18n with fallback)
    document.title = tWithFallback('site_label_name', 'badge_text');

    // 사이트 타이틀 (좌상단)
    const siteTitle = document.querySelector('.site-badge');
    if (siteTitle) {
        if (mainConfig.show_badge) {
            const badgeType = (mainConfig.badge_type || 'text').toLowerCase();
            const badgeText = tWithFallback('site_label_name', 'badge_text');
            // Reset state
            siteTitle.classList.remove('image-badge');
            siteTitle.style.display = '';
            if (badgeType === 'image' && mainConfig.badge_image) {
                // Image mode: ignore color/text, show image
                const imgSrc = mainConfig.badge_image; // already normalized in loadMainConfig if provided
                siteTitle.innerHTML = '';
                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = badgeText;
                img.className = 'site-badge-image';
                siteTitle.appendChild(img);
                siteTitle.classList.add('image-badge');
                console.log('[badge] Using image badge:', imgSrc);
            } else {
                // Text mode (default)
                siteTitle.textContent = badgeText;
                console.log('[badge] Using text badge:', badgeText);
            }
        } else {
            siteTitle.style.display = 'none';
        }
    }

    // 메인 제목 (i18n with fallback)
    const mainTitle = document.querySelector('.header-main h1');
    if (mainTitle) {
        mainTitle.textContent = tWithFallback('main_title', 'title');
    }

    // 메인 부제목 (i18n with fallback)
    const mainSubtitle = document.querySelector('.header-main p');
    if (mainSubtitle) {
        mainSubtitle.textContent = tWithFallback('main_subtitle', 'subtitle');
    }

    // 사이트 URL (좌상단 링크로 만들기)
    if (siteTitle && mainConfig.show_badge && !siteTitle.parentElement.href && mainConfig.badge_url) {
        // 사이트 타이틀을 링크로 감싸기
        const link = document.createElement('a');
        link.href = mainConfig.badge_url;
        link.style.textDecoration = 'none';
        link.style.color = 'inherit';
        siteTitle.parentElement.insertBefore(link, siteTitle);
        link.appendChild(siteTitle);
    }

    // 저작권 텍스트
    const copyrightText = document.querySelector('.footer p');
    if (copyrightText) {
        copyrightText.textContent = mainConfig.copyright_text;
    }

    // 홈 버튼 표시/숨김 및 라벨
    const homeButton = document.querySelector('.footer .home-button');
    if (homeButton) {
        if (mainConfig.show_home_button) {
            homeButton.style.display = '';
            homeButton.textContent = t('btn_home_main');
        } else {
            homeButton.style.display = 'none';
        }
    }
}

// 뷰 모드 컨트롤 초기화
function initializeViewModeControls() {
    const viewModeSelect = document.getElementById('viewModeSelect');
    const viewControls = document.querySelector('.view-controls');
    
    if (viewModeSelect) {
        // Insert RSS icon to the left of the listbox (two spaces gap) using mainConfig.rss_feed_url
        try {
            if (viewControls && !document.getElementById('rssLinkMain')) {
                const rssUrlRaw = (mainConfig && typeof mainConfig.rss_feed_url !== 'undefined') ? String(mainConfig.rss_feed_url || '') : '';
                const rssUrl = rssUrlRaw.trim();
                if (rssUrl) {
                    const a = document.createElement('a');
                    a.id = 'rssLinkMain';
                    a.className = 'rss-link';
                    a.href = rssUrl;
                    a.target = '_blank';
                    a.rel = 'noopener';
                    a.title = t('lbl_rss_subscribe');
                    a.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style="vertical-align: -2px;"><path d="M6.18 17.82A2.18 2.18 0 1 1 4 20a2.18 2.18 0 0 1 2.18-2.18M4 10.5a9.5 9.5 0 0 1 9.5 9.5h-3A6.5 6.5 0 0 0 4 13.5zm0-6A15.5 15.5 0 0 1 19.5 20h-3A12.5 12.5 0 0 0 4 7.5z"/></svg><span class="rss-text">RSS</span>';
                    // Insert after select with a double NBSP gap, grouped on the right
                    let rightControls = document.querySelector('.view-controls .right-controls');
                    if (!rightControls) {
                        rightControls = document.createElement('span');
                        rightControls.className = 'right-controls';
                        rightControls.style.display = 'inline-flex';
                        rightControls.style.alignItems = 'center';
                        // Move the select into the rightControls group and append to container (right side)
                        viewControls.appendChild(rightControls);
                    }
                    // Ensure select is placed first
                    rightControls.appendChild(viewModeSelect);
                    // Double space gap
                    rightControls.appendChild(document.createTextNode('\u00A0'));
                    rightControls.appendChild(document.createTextNode('\u00A0'));
                    // Place RSS link after the select
                    rightControls.appendChild(a);
                }
            }
        } catch (e) { /* ignore */ }

        // show_view_filter 설정에 따라 뷰 필터 표시/숨김
        if (mainConfig.show_view_filter === false) {
            viewModeSelect.style.display = 'none';
        } else {
            viewModeSelect.style.display = '';
            
            // 뷰 필터가 표시되는 경우에만 이벤트 리스너 추가
            viewModeSelect.addEventListener('change', async (e) => {
                currentViewMode = e.target.value;
                currentPage = 1;
                await renderDocuments();
                restoreSearchInput();
                updateSearchStats(currentSearchTerm);
            });
        }
        
        // 초기값 설정 (currentViewMode는 이미 loadDocuments에서 설정됨)
        viewModeSelect.value = currentViewMode;
    }
}

// 키보드 단축키
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('documentSearch');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }

        if (e.key === 'Escape') {
            const searchInput = document.getElementById('documentSearch');
            if (searchInput && searchInput.value) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
            }
        }
    });
}


// 초기화
document.addEventListener('DOMContentLoaded', async () => {
    await loadMainConfig();
    await initializeI18nFromLocalePref(mainConfig.site_locale);
    await initializePageTheme('main', mainConfig);

    await loadDocuments();
    applyMainConfigLabels();

    setTimeout(() => {
        initializeViewModeControls();
        initializeSearch();
        initializeKeyboardShortcuts();
    }, 100);
});
