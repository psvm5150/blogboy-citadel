let documentCategories = {};
let currentViewMode = 'category'; // Default value, will be changed during initialization based on settings

// toc.json 파일 로드
async function loadToc() {
    try {
        const response = await fetch('properties/toc.json');
        if (!response.ok) {
            throw new Error(`Failed to load toc.json: ${response.status}`);
        }
        documentCategories = await response.json();
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

        await renderDocuments();

    } catch (error) {
        console.error('Error loading documents:', error);
        postsContainer.innerHTML = `<div class="loading">${t('msg_failed_load_documents')}</div>`;
    }
}

// 현재 뷰 모드에 따라 문서 렌더링
async function renderDocuments() {
    const postsContainer = document.getElementById('postsContainer');
    
    // 로딩 표시
    postsContainer.innerHTML = `<div class="loading">${t('msg_loading_documents')}</div>`;
    
    let html = '';

    try {
        if (currentViewMode === 'all') {
            // 전체보기 모드
            html = await createAllViewSection();
        } else {
            // 분류보기 모드 (기본)
            const sectionPromises = [];
            for (const [categoryKey, categoryInfo] of Object.entries(documentCategories)) {
                if (categoryInfo.files && categoryInfo.files.length > 0) {
                    sectionPromises.push(createCategorySection(categoryInfo.title, categoryInfo.files));
                }
            }
            const sections = await Promise.all(sectionPromises);
            html = sections.join('');
        }

        if (html === '') {
            postsContainer.innerHTML = `<div class="loading">${t('msg_no_documents')}</div>`;
        } else {
            postsContainer.innerHTML = html;

            const totalDocs = Object.values(documentCategories)
                .reduce((total, category) => total + category.files.length, 0);
            console.log(`Total ${totalDocs} documents loaded in ${currentViewMode} mode`);
        }
    } catch (error) {
        console.error('Error rendering documents:', error);
        postsContainer.innerHTML = `<div class="loading">${t('msg_failed_render_documents')}</div>`;
    }
}


// 파일이 "new" 표시를 받을지 확인하는 함수
async function shouldShowNewIndicator(filePath) {
    if (!mainConfig.show_new_indicator) {
        return false;
    }
    
    const fileDate = await getFileModifiedDate(filePath);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate - fileDate) / (1000 * 60 * 60 * 24));
    
    return daysDiff <= mainConfig.new_display_days;
}

// 문서 날짜 표시 HTML 생성
function createDateTimeDisplay(modifiedDate) {
    if (!mainConfig.show_document_date || !modifiedDate || modifiedDate.getTime() <= new Date('1970-01-01').getTime()) {
        return '';
    }
    
    // 사용자의 로케일에 따른 날짜/시간 형식 적용
    const dateOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    
    const formattedDate = modifiedDate.toLocaleDateString(navigator.language, dateOptions);
    const formattedTime = modifiedDate.toLocaleTimeString(navigator.language, timeOptions);
    
    return `<span class="new-datetime">${formattedDate} ${formattedTime}</span>`;
}

// "new" 표시 HTML 생성
function createNewIndicator() {
    return `<span class="new-indicator">${t('lbl_new_indicator')}</span>`;
}

// 카테고리 섹션 생성
async function createCategorySection(title, files) {
    const documentRoot = normalizePath(mainConfig.document_root);
    
    // 각 파일에 대해 비동기적으로 new indicator 및 날짜 확인
    const fileListPromises = files.map(async (file) => {
        const showNew = await shouldShowNewIndicator(file.path);
        // show_document_date가 true이면 항상 날짜를 가져옴
        const modifiedDate = (mainConfig.show_document_date || showNew) ? await getFileModifiedDate(file.path) : null;
        const newIndicator = showNew ? createNewIndicator() : '';
        const dateTimeDisplay = createDateTimeDisplay(modifiedDate);
        return `
            <li class="post-item">
                <a href="viewer.html?file=${documentRoot}${file.path}" class="post-link">
                    ${file.title}${newIndicator}${dateTimeDisplay}
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
    
    // 각 파일의 서버 수정일을 가져와서 정렬용 데이터 준비
    const filesWithDates = await Promise.all(
        allFiles.map(async (file) => {
            const modifiedDate = await getFileModifiedDate(file.path);
            return {
                ...file,
                serverModifiedDate: modifiedDate
            };
        })
    );
    
    // 서버 수정일 기준으로 정렬 (최신순)
    filesWithDates.sort((a, b) => {
        return b.serverModifiedDate - a.serverModifiedDate; // 내림차순 (최신이 위로)
    });
    
    // 각 파일에 대해 비동기적으로 new indicator 및 날짜 확인
    const fileListPromises = filesWithDates.map(async (file) => {
        const showNew = await shouldShowNewIndicator(file.path);
        const newIndicator = showNew ? createNewIndicator() : '';
        const dateTimeDisplay = createDateTimeDisplay(file.serverModifiedDate);
        const categoryName = `<span class="category-name">${file.categoryTitle}</span>`;
        return `
            <li class="post-item">
                <a href="viewer.html?file=${documentRoot}${file.path}" class="post-link">
                    ${file.title}${newIndicator}${dateTimeDisplay}${categoryName}
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
function initializeSearch() {
    const searchContainer = document.querySelector('.main-content .container');

    if (searchContainer) {
        const searchHTML = `
            <div class="search-container" style="margin-bottom: 32px;">
                <input type="text" id="documentSearch" placeholder="${t('lbl_document_search')}" 
                       style="width: 100%; padding: 12px 16px; border: 1px solid #d0d7de; border-radius: 6px; font-size: 16px; outline: none; box-sizing: border-box;">
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
    const searchTerm = event.target.value.toLowerCase();
    const allCategories = document.querySelectorAll('.category-section');
    let totalVisible = 0;

    allCategories.forEach(category => {
        const posts = category.querySelectorAll('.post-item');
        let hasVisiblePosts = false;

        posts.forEach(post => {
            const title = post.querySelector('.post-link').textContent.toLowerCase();
            const isVisible = title.includes(searchTerm);

            post.style.display = isVisible ? 'block' : 'none';
            if (isVisible) {
                hasVisiblePosts = true;
                totalVisible++;
            }
        });

        category.style.display = hasVisiblePosts ? 'block' : 'none';

        const categoryCount = category.querySelector('.category-count');
        if (categoryCount && mainConfig.show_document_count) {
            const visibleCount = Array.from(posts).filter(post => 
                post.style.display !== 'none'
            ).length;

            if (hasVisiblePosts) {
                categoryCount.textContent = searchTerm ? `${visibleCount} ${t('lbl_document_count')}` : `${posts.length} ${t('lbl_document_count')}`;
            }
        }
    });

    updateSearchStats(searchTerm, totalVisible);
}

// 검색 통계 업데이트
function updateSearchStats(searchTerm = '', visibleCount = null) {
    const searchStats = document.getElementById('searchStats');
    if (!searchStats) return;

    const totalDocs = Object.values(documentCategories)
        .reduce((total, category) => total + category.files.length, 0);

    if (searchTerm) {
        const actualVisible = visibleCount !== null ? visibleCount : totalDocs;
        searchStats.textContent = `"${searchTerm}" ${t('lbl_search_result')}: ${actualVisible}${t('lbl_document_count')} 문서`;
    } else {
        searchStats.textContent = t('lbl_total_documents', {
            count: totalDocs,
            categories: Object.keys(documentCategories).length
        });
    }
}

// 메인 페이지 라벨 적용
function applyMainConfigLabels() {
    // 문서 타이틀
    document.title = mainConfig.site_label_name;

    // 사이트 타이틀 (좌상단)
    const siteTitle = document.querySelector('.site-title');
    if (siteTitle) {
        if (mainConfig.show_site_label) {
            siteTitle.textContent = mainConfig.site_label_name;
            siteTitle.style.display = '';
        } else {
            siteTitle.style.display = 'none';
        }
    }

    // 메인 제목
    const mainTitle = document.querySelector('.header-main h1');
    if (mainTitle) {
        mainTitle.textContent = mainConfig.main_title;
    }

    // 메인 부제목
    const mainSubtitle = document.querySelector('.header-main p');
    if (mainSubtitle) {
        mainSubtitle.textContent = mainConfig.main_subtitle;
    }

    // 사이트 URL (좌상단 링크로 만들기)
    if (siteTitle && mainConfig.show_site_label && !siteTitle.parentElement.href) {
        // 사이트 타이틀을 링크로 감싸기
        const link = document.createElement('a');
        link.href = mainConfig.site_label_url;
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
                await renderDocuments();
                
                // 검색이 활성화되어 있다면 다시 적용
                const searchInput = document.getElementById('documentSearch');
                if (searchInput && searchInput.value) {
                    searchInput.dispatchEvent(new Event('input'));
                }
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

// i18n 적용 함수
function applyI18nTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
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

    setTimeout(() => {
        initializeViewModeControls();
        initializeSearch();
        initializeKeyboardShortcuts();
    }, 100);
});
