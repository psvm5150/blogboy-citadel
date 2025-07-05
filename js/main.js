// 정적 문서 목록 - Git API 사용하지 않고 직접 관리
const documentCategories = {
    'certificate': {
        title: '🔐 인증서 관리',
        files: [
            { name: 'cert.md', title: '인증서 생성 및 관리 가이드', path: 'posts/cert/cert.md' }
        ]
    },
    'git': {
        title: '🌐 Git & 버전관리',
        files: [
            { name: 'GitServer.md', title: 'Git 서버 구축 가이드', path: 'posts/git-server/GitServer.md' },
            { name: 'SubversionGuide.md', title: 'Subversion 사용법', path: 'posts/svn/SubversionGuide.md' }
        ]
    },
    'ide': {
        title: '💡 IDE & 개발도구',
        files: [
            { name: 'IntelliJIdeaUsersGuide.md', title: 'IntelliJ IDEA 사용자 가이드', path: 'posts/idea/IntelliJIdeaUsersGuide.md' },
            { name: 'shortcuts.md', title: 'IntelliJ IDEA 단축키 모음', path: 'posts/idea-shortcuts/shortcuts.md' }
        ]
    },
    'editor': {
        title: '📝 에디터 & 마크다운',
        files: [
            { name: 'MarkDownGuide.md', title: 'MarkDown 완벽 가이드', path: 'posts/md/MarkDownGuide.md' },
            { name: 'SubLimeTextUsersGuide.md', title: 'SublimeText 사용자 가이드', path: 'posts/sltext/SubLimeTextUsersGuide.md' },
            { name: 'shortcuts.md', title: 'SublimeText 단축키 모음', path: 'posts/sltext-shortcuts/shortcuts.md' },
            { name: 'vi-vim-guide.md', title: 'Vi/Vim 완벽 사용법', path: 'posts/vi/vi-vim-guide.md' }
        ]
    },
    'framework': {
        title: '🌱 프레임워크 & 라이브러리',
        files: [
            { name: 'SpringInitializrGuide.md', title: 'Spring Initializr 가이드', path: 'posts/spring-init/SpringInitializrGuide.md' }
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

    console.log('Loading static document list...');

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
            console.log('Static documents loaded successfully');
            
            // 통계 표시
            const totalDocs = Object.values(documentCategories)
                .reduce((total, category) => total + category.files.length, 0);
            console.log(`📊 총 ${totalDocs}개 문서가 ${Object.keys(documentCategories).length}개 카테고리에 로드됨`);
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
                    ${file.title}
                </a>
            </li>
        `)
        .join('');

    return `
        <div class="category-section">
            <div class="category-header">
                <div class="category-title">${title}</div>
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
                       style="width: 100%; padding: 12px 16px; border: 1px solid #d0d7de; border-radius: 6px; font-size: 16px; outline: none;">
            </div>
        `;
        
        const postsContainer = document.getElementById('postsContainer');
        postsContainer.insertAdjacentHTML('beforebegin', searchHTML);
        
        // 검색 이벤트 리스너
        const searchInput = document.getElementById('documentSearch');
        searchInput.addEventListener('input', handleSearch);
    }
}

// 검색 처리
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const allCategories = document.querySelectorAll('.category-section');
    
    allCategories.forEach(category => {
        const posts = category.querySelectorAll('.post-item');
        let hasVisiblePosts = false;
        
        posts.forEach(post => {
            const title = post.querySelector('.post-link').textContent.toLowerCase();
            const isVisible = title.includes(searchTerm);
            
            post.style.display = isVisible ? 'block' : 'none';
            if (isVisible) hasVisiblePosts = true;
        });
        
        // 카테고리에 보이는 포스트가 없으면 카테고리도 숨기기
        category.style.display = hasVisiblePosts ? 'block' : 'none';
    });
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing static document loader...');
    loadDocuments();
    
    // 검색 기능 초기화
    setTimeout(() => {
        initializeSearch();
    }, 100);
});