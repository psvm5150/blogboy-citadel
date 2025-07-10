let documentCategories = {};

// toc.json 파일 로드
async function loadToc() {
    try {
        const response = await fetch('./properties/toc.json');
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
        await loadToc();
        
        let html = '';
        
        for (const [categoryKey, categoryInfo] of Object.entries(documentCategories)) {
            if (categoryInfo.files && categoryInfo.files.length > 0) {
                html += createCategorySection(categoryInfo.title, categoryInfo.files);
            }
        }

        if (html === '') {
            postsContainer.innerHTML = '<div class="loading">❌ 표시할 문서가 없습니다.</div>';
        } else {
            postsContainer.innerHTML = html;
            
            const totalDocs = Object.values(documentCategories)
                .reduce((total, category) => total + category.files.length, 0);
            console.log(`Total ${totalDocs} documents loaded`);
        }

    } catch (error) {
        console.error('Error loading documents:', error);
        postsContainer.innerHTML = '<div class="loading">❌ 문서 목록을 불러오는데 실패했습니다.</div>';
    }
}

// 카테고리 섹션 생성
function createCategorySection(title, files) {
    const fileList = files
        .map(file => `
            <li class="post-item">
                <a href="viewer.html?file=posts/${file.path}" class="post-link">
                    ${file.title}
                </a>
            </li>
        `)
        .join('');

    return `
        <div class="category-section">
            <div class="category-header">
                <div class="category-title">${title}</div>
                <div class="category-count">${files.length}개</div>
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
                <input type="text" id="documentSearch" placeholder="🔍 문서 검색..." 
                       style="width: 100%; padding: 12px 16px; border: 1px solid #d0d7de; border-radius: 6px; font-size: 16px; outline: none; box-sizing: border-box;">
                <div id="searchStats" style="margin-top: 8px; font-size: 14px; color: #656d76;"></div>
            </div>
        `;
        
        const postsContainer = document.getElementById('postsContainer');
        postsContainer.insertAdjacentHTML('beforebegin', searchHTML);
        
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
        const visibleCount = Array.from(posts).filter(post => 
            post.style.display !== 'none'
        ).length;
        
        if (hasVisiblePosts) {
            categoryCount.textContent = searchTerm ? `${visibleCount}개` : `${posts.length}개`;
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
        searchStats.textContent = `"${searchTerm}" 검색 결과: ${actualVisible}개 문서`;
    } else {
        searchStats.textContent = `총 ${totalDocs}개 문서 (${Object.keys(documentCategories).length}개 카테고리)`;
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
document.addEventListener('DOMContentLoaded', () => {
    loadDocuments();
    
    setTimeout(() => {
        initializeSearch();
        initializeKeyboardShortcuts();
    }, 100);
});