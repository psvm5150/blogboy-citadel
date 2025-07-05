// 실제 존재하는 문서 목록 (정적)
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
            { name: 'README.md', title: 'IntelliJ IDEA 가이드', path: 'posts/idea/README.md' },
            { name: 'README.md', title: 'IntelliJ 단축키', path: 'posts/idea-shortcuts/README.md' }
        ]
    },
    'framework': {
        title: '🌱 프레임워크 & 라이브러리',
        files: [
            { name: 'README.md', title: 'Spring 초기화 가이드', path: 'posts/spring-init/README.md' }
        ]
    },
    'tools': {
        title: '🔧 도구 & 유틸리티',
        files: [
            { name: 'README.md', title: 'SLText 가이드', path: 'posts/sltext/README.md' },
            { name: 'README.md', title: 'SLText 단축키', path: 'posts/sltext-shortcuts/README.md' },
            { name: 'README.md', title: 'Swagger 설정', path: 'posts/swagger/README.md' }
        ]
    },
    'server': {
        title: '🌐 서버 & 인프라',
        files: [
            { name: 'README.md', title: 'Git 서버 설정', path: 'posts/git-server/README.md' },
            { name: 'README.md', title: 'SVN 가이드', path: 'posts/svn/README.md' }
        ]
    },
    'security': {
        title: '🔐 보안 & 인증',
        files: [
            { name: 'README.md', title: '인증서 관리', path: 'posts/cert/README.md' }
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

// GitHub API로 실제 파일 목록 가져오기 (백업 함수)
async function loadDocumentsFromGitHub() {
    const postsContainer = document.getElementById('postsContainer');
    
    postsContainer.innerHTML = '<div class="loading">🔄 GitHub에서 문서 목록을 불러오는 중...</div>';

    const apiCategories = ['md', 'vi', 'idea', 'idea-shortcuts', 'spring-init', 'sltext', 'sltext-shortcuts', 'swagger', 'git-server', 'svn', 'cert'];
    
    try {
        const allDocs = {};
        
        for (const category of apiCategories) {
            try {
                const response = await fetch(`https://api.github.com/repos/tansan5150/tansan5150.github.io/contents/posts/${category}`, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (response.ok) {
                    const files = await response.json();
                    if (Array.isArray(files)) {
                        const mdFiles = files
                            .filter(file => file.name.endsWith('.md') && file.name !== 'demo1.md')
                            .map(file => ({
                                name: file.name,
                                title: file.name.replace('.md', '').replace(/[-_]/g, ' '),
                                path: `posts/${category}/${file.name}`
                            }));

                        if (mdFiles.length > 0) {
                            allDocs[category] = mdFiles;
                        }
                    }
                }
                
                // API 요청 간격 조절
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.warn(`Failed to load category ${category}:`, error);
            }
        }

        // 결과 처리
        let html = '';
        const categoryMapping = {
            'md': '📝 마크다운',
            'vi': '⌨️ Vi/Vim',
            'idea': '💡 IntelliJ IDEA',
            'idea-shortcuts': '⚡ IDEA 단축키',
            'spring-init': '🌱 Spring 초기화',
            'sltext': '📄 SLText',
            'sltext-shortcuts': '⚡ SLText 단축키',
            'swagger': '🔗 Swagger',
            'git-server': '🌐 Git 서버',
            'svn': '🔄 SVN',
            'cert': '🔐 인증서'
        };

        for (const [category, files] of Object.entries(allDocs)) {
            const title = categoryMapping[category] || `📁 ${category}`;
            html += createCategorySection(title, files);
        }

        if (html === '') {
            postsContainer.innerHTML = '<div class="loading">📭 GitHub에서 문서를 찾을 수 없습니다.</div>';
        } else {
            postsContainer.innerHTML = html;
            console.log('Documents loaded from GitHub API');
        }

    } catch (error) {
        console.error('GitHub API error:', error);
        postsContainer.innerHTML = '<div class="loading">❌ GitHub API 오류가 발생했습니다.</div>';
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing document loader...');
    
    // 먼저 정적 문서 목록 로드
    loadDocuments();
    
    // 실제 GitHub API 사용해보고 싶으면 아래 주석 해제
    // setTimeout(() => {
    //     loadDocumentsFromGitHub();
    // }, 2000);
});

// 페이지 가시성 변경 시 재로드 (선택사항)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && document.getElementById('postsContainer').innerHTML.includes('불러오는 중')) {
        loadDocuments();
    }
});