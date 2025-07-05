// README.md의 ### 태그를 기준으로 한 문서 그룹화
const documentGroups = {
    'editor': {
        title: '📝 에디터 & 마크다운',
        categories: ['md', 'vi']
    },
    'ide': {
        title: '💡 IDE & 개발도구',
        categories: ['idea', 'idea-shortcuts']
    },
    'framework': {
        title: '🌱 프레임워크 & 라이브러리',
        categories: ['spring-init']
    },
    'tools': {
        title: '🔧 도구 & 유틸리티',
        categories: ['sltext', 'sltext-shortcuts', 'swagger']
    },
    'server': {
        title: '🌐 서버 & 인프라',
        categories: ['git-server', 'svn']
    },
    'security': {
        title: '🔐 보안 & 인증',
        categories: ['cert']
    }
};

// GitHub API를 통해 문서 목록 가져오기
async function loadDocuments() {
    const postsContainer = document.getElementById('postsContainer');
    
    // 로딩 상태 표시
    postsContainer.innerHTML = '<div class="loading">📚 문서 목록을 불러오는 중...</div>';

    try {
        const allFiles = {};
        
        // 각 그룹의 카테고리별로 파일 로드
        for (const [groupKey, groupInfo] of Object.entries(documentGroups)) {
            for (const category of groupInfo.categories) {
                try {
                    const response = await fetch(`https://api.github.com/repos/tansan5150/tansan5150.github.io/contents/posts/${category}`);
                    if (response.ok) {
                        const files = await response.json();
                        if (Array.isArray(files)) {
                            const mdFiles = files
                                .filter(file => file.name.endsWith('.md') && file.name !== 'demo1.md')
                                .map(file => ({
                                    name: file.name,
                                    path: `posts/${category}/${file.name}`,
                                    title: file.name.replace('.md', '')
                                }));
                            
                            if (mdFiles.length > 0) {
                                if (!allFiles[groupKey]) {
                                    allFiles[groupKey] = [];
                                }
                                allFiles[groupKey].push(...mdFiles);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error loading ${category}:`, error);
                }
            }
        }

        // HTML 생성
        let html = '';
        
        for (const [groupKey, groupInfo] of Object.entries(documentGroups)) {
            if (allFiles[groupKey] && allFiles[groupKey].length > 0) {
                html += createGroupSection(groupInfo.title, allFiles[groupKey]);
            }
        }

        if (html === '') {
            postsContainer.innerHTML = '<div class="loading">📭 표시할 문서가 없습니다.</div>';
        } else {
            postsContainer.innerHTML = html;
        }

    } catch (error) {
        console.error('Error loading documents:', error);
        postsContainer.innerHTML = '<div class="loading">❌ 문서 목록을 불러오는데 실패했습니다.</div>';
    }
}

// 그룹 섹션 생성
function createGroupSection(title, files) {
    const fileList = files
        .map(file => `
            <li class="post-item">
                <a href="viewer.html?file=${file.path}" class="post-link">
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

// 페이지 로드 시 문서 로드
document.addEventListener('DOMContentLoaded', loadDocuments);