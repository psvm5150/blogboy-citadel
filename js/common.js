/**
 * Common utilities shared between main.js and viewer.js
 * This file contains shared functions and variables to avoid code duplication
 */

// Global configuration object shared across modules
let mainConfig = {};

/**
 * Path normalization function - converts various path formats to consistent format
 * @param {string} path - The path to normalize
 * @returns {string} - Normalized path
 */
function normalizePath(path) {
    if (!path) return 'posts/';
    
    // Convert to string
    path = String(path);
    
    // Remove leading/trailing whitespace
    path = path.trim();
    
    // Return default if empty string
    if (!path) return 'posts/';
    
    // Remove "./" prefix
    if (path.startsWith('./')) {
        path = path.substring(2);
    }
    
    // Remove leading "/"
    if (path.startsWith('/')) {
        path = path.substring(1);
    }
    
    // Check if it's a filename (has extension)
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(path);
    
    // Add trailing "/" only if it's not a filename
    if (!hasExtension && !path.endsWith('/')) {
        path += '/';
    }
    
    return path;
}

/**
 * Load main-config.json file
 * @param {string} basePath - Base path for the config file (optional, defaults to current directory)
 * @returns {Promise<Object>} - Promise that resolves to the loaded configuration
 */
async function loadMainConfig(basePath = '') {
    const configPath = basePath ? `${basePath}/properties/main-config.json` : 'properties/main-config.json';
    
    try {
        const response = await fetch(configPath);
        if (!response.ok) {
            throw new Error(`Failed to load main-config.json: ${response.status}`);
        }
        
        mainConfig = await response.json();
        console.log('Main config loaded successfully');
        return mainConfig;
    } catch (error) {
        console.error('Error loading main config:', error);
        throw error;
    }
}

/**
 * Check if the current site is hosted on GitHub Pages
 * @returns {boolean} - True if hosted on GitHub Pages
 */
function isGitHubPages() {
    return window.location.hostname.endsWith('.github.io');
}

/**
 * Generate GitHub API URL for getting commit information
 * @param {string} filePath - The file path to get commit info for
 * @returns {string|null} - GitHub API URL or null if not applicable
 */
function generateGitHubApiUrl(filePath) {
    const hostname = window.location.hostname;
    if (!hostname.endsWith('.github.io')) {
        return null;
    }
    
    // Extract username from hostname (e.g., psvm5150.github.io -> psvm5150)
    const username = hostname.split('.')[0];
    const repoName = hostname; // Use full hostname as repo name
    
    // Normalize file path (remove posts/ prefix)
    const documentRoot = normalizePath(mainConfig.document_root);
    let normalizedPath = filePath;
    if (filePath.startsWith(documentRoot)) {
        normalizedPath = filePath.substring(documentRoot.length);
    }
    
    return `https://api.github.com/repos/${username}/${repoName}/commits?path=posts/${normalizedPath}&per_page=1`;
}

/**
 * Get commit date from GitHub API
 * @param {string} filePath - The file path to get commit date for
 * @returns {Promise<Date|null>} - Promise that resolves to commit date or null
 */
async function getGitHubCommitDate(filePath) {
    try {
        const apiUrl = generateGitHubApiUrl(filePath);
        if (!apiUrl) {
            return null;
        }
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.warn(`GitHub API request failed for ${filePath}: ${response.status}`);
            return null;
        }
        
        const commits = await response.json();
        if (commits && commits.length > 0) {
            const commitDate = commits[0].commit.committer.date;
            return new Date(commitDate);
        }
        
        return null;
    } catch (error) {
        console.warn(`Failed to get GitHub commit date for ${filePath}:`, error);
        return null;
    }
}

/**
 * Get file modification date from various sources
 * @param {string} filePath - The file path to get modification date for
 * @returns {Promise<Date>} - Promise that resolves to modification date
 */
async function getFileModifiedDate(filePath) {
    try {
        const documentRoot = normalizePath(mainConfig.document_root);
        const fullPath = documentRoot + filePath;
        
        // Check if it's GitHub Pages
        if (isGitHubPages()) {
            // Use GitHub API for GitHub Pages
            const gitHubDate = await getGitHubCommitDate(filePath);
            if (gitHubDate) {
                return gitHubDate;
            }
            // Fallback to HTTP headers if GitHub API fails
        }
        
        // Use HTTP Last-Modified header if not GitHub Pages or GitHub API failed
        const headResponse = await fetch(fullPath, { method: 'HEAD' });
        if (headResponse.ok) {
            const lastModified = headResponse.headers.get('Last-Modified');
            if (lastModified) {
                return new Date(lastModified);
            }
        }
        
        // Return default date if all methods fail
        return new Date('1970-01-01');
    } catch (error) {
        console.warn(`Failed to get modified date for ${filePath}:`, error);
        return new Date('1970-01-01');
    }
}