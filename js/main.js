// bak/index.html 기준 문서 분류로 수정
const documentCategories = {
    'editor': {
        title: '📝 에디터 & 마크다운',
        files: [
            { name: 'MarkDownGuide.md', title: 'MarkDown 가이드', path: 'posts/md/MarkDownGuide.md' }
        ]
    },
    'ide': {
        title: '💡 IDE & 개발도구',
        files: [
            { name: 'IntelliJIdeaUsersGuide.md', title: 'IntelliJ IDEA 사용자 가이드', path: 'posts/idea/IntelliJIdeaUsersGuide.md' },
            { name: 'shortcuts.md', title: 'IntelliJ 단축키', path: 'posts/idea-shortcuts/shortcuts.md' }
        ]
    },
    'framework': {
        title: '🌱 프레임워크 & 라이브러리',
        files: [
            { name: 'SpringInitializrGuide.md', title: 'Spring 초기화 가이드', path: 'posts/spring-init/SpringInitializrGuide.md' }
        ]
    },
    'tools': {
        title: '🔧 도구 & 유틸리티',
        files: [
            { name: 'SubLimeTextUsersGuide.md', title: 'SublimeText 사용자 가이드', path: 'posts/sltext/SubLimeTextUsersGuide.md' }
        ]
    }
};

// 문서 목록 로드
function loadDocuments() {
    const postsContainer = document.getElementById('postsContainer');
    
    if (!postsContainer) {
        console.error('postsContainer element not found!');
        return;
    }

    console.log('Loading documents...');

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
            console.log('Documents loaded successfully');
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

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing document loader...');
    loadDocuments();
});