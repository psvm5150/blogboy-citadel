// URL 파라미터에서 파일 경로 가져오기
function getFileParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('file');
}

// GitHub의 raw 파일 URL로 마크다운 파일 가져오기
async function loadMarkdown(filePath) {
    const contentDiv = document.getElementById('content');

    try {
        const response = await fetch(`https://raw.githubusercontent.com/tansan5150/tansan5150.github.io/main/${filePath}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const markdown = await response.text();
        const html = marked.parse(markdown);

        contentDiv.innerHTML = `<div class="markdown-content">${html}</div>`;

        // 문서 제목 업데이트
        updateDocumentTitle(contentDiv);

        // 코드 블록 스타일링 향상
        enhanceCodeBlocks();

    } catch (error) {
        console.error('Error loading markdown:', error);
        showError(contentDiv, filePath, error.message);
    }
}

// 문서 제목 업데이트
function updateDocumentTitle(contentDiv) {
    const firstH1 = contentDiv.querySelector('h1');
    if (firstH1) {
        document.title = `${firstH1.textContent} - Main Max: Fury Load`;
    }
}

// 에러 표시
function showError(contentDiv, filePath, errorMessage) {
    contentDiv.innerHTML = `
        <div class="error">
            <h2>❌ 문서를 불러올 수 없습니다</h2>
            <p><strong>파일 경로:</strong> ${filePath}</p>
            <p><strong>오류:</strong> ${errorMessage}</p>
            <br>
            <a href="/" class="home-button">홈으로 돌아가기</a>
        </div>
    `;
}

// 코드 블록 스타일링 향상
function enhanceCodeBlocks() {
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
        // 언어 감지 및 표시 (선택사항)
        const className = block.className;
        if (className.includes('language-')) {
            const language = className.replace('language-', '');
            const pre = block.parentElement;
            pre.setAttribute('data-language', language);
        }
    });
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    const filePath = getFileParameter();

    if (filePath) {
        loadMarkdown(filePath);
    } else {
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = `
            <div class="error">
                <h2>❌ 파일 경로가 지정되지 않았습니다</h2>
                <p>올바른 파일 경로를 URL 파라미터로 제공해주세요.</p>
                <br>
                <a href="/" class="home-button">홈으로 돌아가기</a>
            </div>
        `;
    }
});