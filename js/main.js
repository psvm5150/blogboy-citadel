// 포스트 카테고리 구조 정의
const postCategories = {
    'md': { title: 'Markdown', icon: '📝' },
    'vi': { title: 'Vi/Vim', icon: '⌨️' },
    'svn': { title: 'SVN', icon: '🔄' },
    'cert': { title: 'Certificate', icon: '🔐' },
    'idea': { title: 'IntelliJ IDEA', icon: '💡' },
    'sltext': { title: 'SLText', icon: '📄' },
    'swagger': { title: 'Swagger', icon: '🔗' },
    'git-server': { title: 'Git Server', icon: '🌐' },
    'spring-init': { title: 'Spring Init', icon: '🌱' },
    'idea-shortcuts': { title: 'IDEA Shortcuts', icon: '⚡' },
    'sltext-shortcuts': { title: 'SLText Shortcuts', icon: '⚡' }
};

// GitHub API를 통해 각 카테고리의 파일 목록 가져오기
async function loadPosts() {
    const postsGrid = document.getElementById('postsGrid');

    // 로딩 상태 표시
    postsGrid.innerHTML = '<div class="loading">📚 문서 목록을 불러오는 중...</div>';

    const cardPromises = Object.entries(postCategories).map(async ([category, info]) => {
        try {
            const response = await fetch(`https://api.github.com/repos/tansan5150/tansan5150.github.io/contents/posts/${category}`);
            const files = await response.json();

            if (Array.isArray(files)) {
                const mdFiles = files.filter(file => file.name.endsWith('.md'));

                if (mdFiles.length > 0) {
                    return createPostCard(category, info, mdFiles);
                }
            }
        } catch (error) {
            console.error(`Error loading ${category}:`, error);
        }
        return null;
    });

    const cards = await Promise.all(cardPromises);
    const validCards = cards.filter(card => card !== null);

    // 로딩 상태 제거
    postsGrid.innerHTML = '';

    if (validCards.length === 0) {
        postsGrid.innerHTML = '<div class="loading">📭 표시할 문서가 없습니다.</div>';
        return;
    }

    validCards.forEach(card => {
        postsGrid.appendChild(card);
    });
}

// 포스트 카드 생성
function createPostCard(category, info, files) {
    const card = document.createElement('div');
    card.className = 'post-card';

    const header = document.createElement('div');
    header.className = 'post-card-header';
    header.innerHTML = `
        <h3>${info.icon} ${info.title}</h3>
        <small>${files.length}개의 문서</small>
    `;

    const body = document.createElement('div');
    body.className = 'post-card-body';

    const postList = document.createElement('ul');
    postList.className = 'post-list';

    files.forEach(file => {
        const listItem = document.createElement('li');
        listItem.className = 'post-item';

        const link = document.createElement('a');
        link.href = `viewer.html?file=posts/${category}/${file.name}`;
        link.className = 'post-link';
        link.textContent = file.name.replace('.md', '');

        listItem.appendChild(link);
        postList.appendChild(listItem);
    });

    body.appendChild(postList);
    card.appendChild(header);
    card.appendChild(body);

    return card;
}

// 페이지 로드 시 포스트 로드
document.addEventListener('DOMContentLoaded', loadPosts);