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
        await loadMainConfig();
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

        // 필터링: 검색어가 있으면 전체 영역에서 검색
        const term = (currentSearchTerm || '').trim().toLowerCase();
        let filtered = term
            ? allFlat.filter(it => (it.file.title || '').toLowerCase().includes(term) || (it.categoryTitle || '').toLowerCase().includes(term))
            : allFlat;

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
        const showNew = wrap.tocDate ? await shouldShowNewIndicator(file.path, wrap.tocDate) : false;
        const newIndicator = showNew ? createNewIndicator() : '';
        const displayDate = mainConfig.show_document_date ? wrap.tocDate : null;
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

// 전체보기 모드로 문서 목록 생성
async function createAllViewSection() {
    const documentRoot = normalizePath(mainConfig.document_root);
    
    // 모든 문서를 하나의 배열로 평면화하고 카테고리 정보 추가
    const allFiles = [];
    for (const [categoryKey, categoryInfo] of Object.entries(documentCategories)) {
        if (categoryInfo.files && categoryInfo.files.length > 0) {
            categoryInfo.files.forEach(file => {
                allFiles.push({
                    ...file,
                    categoryTitle: categoryInfo.title
                });
            });
        }
    }
    
    // 정렬용 기준 날짜 준비: toc의 날짜가 있으면 그걸 사용, 없으면 수정일 조회
    const filesWithDates = await Promise.all(
        allFiles.map(async (file) => {
            const tocDate = file && file.date ? parseFlexibleDate(String(file.date)) : null;
            const serverModifiedDate = tocDate ? null : await getFileModifiedDate(file.path);
            const sortDate = tocDate || serverModifiedDate || new Date('1970-01-01');
            return {
                ...file,
                categoryTitle: file.categoryTitle,
                tocDate,
                serverModifiedDate,
                sortDate
            };
        })
    );
    
    // 기준 날짜(sortDate)로 정렬 (최신순)
    filesWithDates.sort((a, b) => b.sortDate - a.sortDate);
    
    // 각 파일에 대해 비동기적으로 new indicator 및 날짜 확인 (추가 네트워크 호출 없음)
    const fileListPromises = filesWithDates.map(async (file) => {
        const baseForNew = file.tocDate || file.serverModifiedDate;
        const showNew = baseForNew ? await shouldShowNewIndicator(file.path, baseForNew) : false;
        const newIndicator = showNew ? createNewIndicator() : '';
        // 표시용 날짜: toc에 있으면 우선, 없으면 serverModifiedDate 사용
        const displayDate = file.tocDate || file.serverModifiedDate;
        const dateTimeDisplay = createDateTimeDisplay(displayDate);
        const categoryName = `<span class="category-name">${file.categoryTitle}</span>`;
        return `
            <li class="post-item">
                <a href="viewer.html?file=${documentRoot}${file.path}" class="post-link">
                    <span class=\"post-title\">${file.title}</span>${newIndicator}${dateTimeDisplay}${categoryName}
                </a>
            </li>
        `;
    });
    
    const fileListArray = await Promise.all(fileListPromises);
    const fileList = fileListArray.join('');

    // 전체보기에서는 show_document_count 설정과 상관없이 카운트를 표시하지 않음
    const countDisplay = '';

    return `
        <div class="category-section">
            <div class="category-header">
                <div class="category-title">${t('lbl_all_documents')}</div>
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
        searchStats.textContent = `"${searchTerm}" ${t('lbl_search_result')}: ${matched}${t('lbl_document_count')} 문서`;
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
    const siteTitle = document.querySelector('.site-title');
    if (siteTitle) {
        if (mainConfig.show_badge) {
            siteTitle.textContent = tWithFallback('site_label_name', 'badge_text');
            siteTitle.style.display = '';
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
    if (siteTitle && mainConfig.show_badge && !siteTitle.parentElement.href) {
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
    // Load main config first to get locale setting
    await loadMainConfig();
    
    // Get locale from config, fallback to 'ko' if not specified
    let locale = mainConfig.site_locale || 'ko';
    if (locale === 'default') {
        // Use browser language detection when set to 'default'
        locale = detectBrowserLanguage();
    }
    
    // Load i18n data with the configured locale
    await loadI18nData(locale);
    applyI18nTranslations();
    
    await loadDocuments();
    applyMainConfigLabels();

    // 테마 토글 버튼 표시/숨김 처리
    const themeToggleBtn = document.getElementById('darkmode-toggle');
    if (themeToggleBtn) {
        if (mainConfig.show_theme_toggle) {
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
        isDarkMode = mainConfig.default_theme === 'dark';
    }

    await setDarkMode(isDarkMode);
    bindDarkModeButton();

    setTimeout(() => {
        initializeViewModeControls();
        initializeSearch();
        initializeKeyboardShortcuts();
    }, 100);
});
