// 완전 정적 문서 목록 - 실제 파일 기준으로 모든 문서 포함 (test.md 제외)
const documentCategories = {
    'markdown': {
        title: '📝 마크다운 & 문서작성',
        files: [
            { name: 'MarkDownGuide.md', title: 'MarkDown 완벽 가이드', path: 'posts/md/MarkDownGuide.md' },
            { name: 'demo1.md', title: 'MarkDown 데모 문서', path: 'posts/md/demo1.md' }
        ]
    },
    'editor': {
        title: '⌨️ 에디터 & 텍스트 편집',
        files: [
            { name: 'vi-vim-guide.md', title: 'Vi/Vim 완벽 사용법', path: 'posts/vi/vi-vim-guide.md' },
            { name: 'SubLimeTextUsersGuide.md', title: 'SublimeText 사용자 가이드', path: 'posts/sltext/SubLimeTextUsersGuide.md' },
            { name: 'shortcuts.md', title: 'SublimeText 단축키 모음', path: 'posts/sltext-shortcuts/shortcuts.md' }
        ]
    },
    'ide': {
        title: '💡 IDE & 개발환경',
        files: [
            { name: 'IntelliJIdeaUsersGuide.md', title: 'IntelliJ IDEA 사용자 가이드', path: 'posts/idea/IntelliJIdeaUsersGuide.md' },
            { name: 'shortcuts.md', title: 'IntelliJ IDEA 단축키 모음', path: 'posts/idea-shortcuts/shortcuts.md' }
        ]
    },
    'framework': {
        title: '🌱 프레임워크 & 개발도구',
        files: [
            { name: 'SpringInitializrGuide.md', title: 'Spring Initializr 가이드', path: 'posts/spring-init/SpringInitializrGuide.md' }
        ]
    },
    'security': {
        title: '🔐 보안 & 인증서',
        files: [
            { name: 'cert.md', title: '인증서 생성 및 관리 가이드', path: 'posts/cert/cert.md' }
        ]
    },
    'vcs': {
        title: '🔄 버전 관리 시스템',
        files: [
            { name: 'GitServer.md', title: 'Git 서버 구축 가이드', path: 'posts/git-server/GitServer.md' },
            { name: 'SubversionGuide.md', title: 'Subversion 완벽 가이드', path: 'posts/svn/SubversionGuide.md' }
        ]
    },
    'api': {
        title: '📄 API & 문서화',
        files: [
            { name: 'swagger-guide.md', title: 'Swagger API 문서화 가이드', path: 'posts/swagger/swagger-guide.md' }
        ]
    }
};

// 문서 목록 로드 (완전 정적)
function loadDocuments() {
    const postsContainer = document.getElementById('postsContainer');
    
    if (!postsContainer) {
        console.error('postsContainer element not found!');
        return;
    }

    console.log('Loading complete static document list...');

    try {
        let html = '';
        
        // 각 카테고리별로 HTML 생성
        for (const [categoryKey, categoryInfo] of Object.entries(documentCategories)) {
            if (categoryInfo.files && categoryInfo.files.length > 0) {
                html += createCategorySection(categoryInfo.title, categoryInfo.files);
            }
        }

        if (html === '') {
            postsContainer.innerHTML = '<div class="loading">📭 표시할 문서가 없습니다.</div>';
        } else {
            postsContainer.innerHTML = html;
            console.log('All static documents loaded successfully');
            
            // 통계 표시
            const totalDocs = Object.values(documentCategories)
                .reduce((total, category) => total + category.files.length, 0);
            console.log(`📊 총 ${totalDocs}개 문서가 ${Object.keys(documentCategories).length}개 카테고리에 로드됨`);
            
            // 각 카테고리별 문서 수 표시
            Object.entries(documentCategories).forEach(([key, category]) => {
                console.log(`   ${category.title}: ${category.files.length}개`);
            });
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
                <a href="viewer.html?file=${encodeURIComponent(file.path)}" class="post-link">
                    <span class="post-title">${file.title}</span>
                    <span class="post-filename">${file.name}</span>
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

// 검색 기능 추가
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
        
        // 검색 이벤트 리스너
        const searchInput = document.getElementById('documentSearch');
        searchInput.addEventListener('input', handleSearch);
        
        // 초기 통계 표시
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
            const title = post.querySelector('.post-title').textContent.toLowerCase();
            const filename = post.querySelector('.post-filename').textContent.toLowerCase();
            const isVisible = title.includes(searchTerm) || filename.includes(searchTerm);
            
            post.style.display = isVisible ? 'block' : 'none';
            if (isVisible) {
                hasVisiblePosts = true;
                totalVisible++;
            }
        });
        
        // 카테고리에 보이는 포스트가 없으면 카테고리도 숨기기
        category.style.display = hasVisiblePosts ? 'block' : 'none';
        
        // 카테고리 개수 업데이트
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

// 키보드 단축키 추가
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+K 또는 Cmd+K로 검색창 포커스
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('documentSearch');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // ESC로 검색 초기화
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
    console.log('DOM loaded, initializing complete document system...');
    loadDocuments();
    
    // 검색 기능 초기화
    setTimeout(() => {
        initializeSearch();
        initializeKeyboardShortcuts();
    }, 100);
});