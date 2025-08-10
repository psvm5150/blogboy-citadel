'use strict';

/**
 * Common utilities shared between main.js and viewer.js
 * This file contains shared functions and variables to avoid code duplication
 */

// Simple in-memory JSON cache to avoid redundant fetches
// Map<url, Promise<any>> ensures single flight per URL
const __jsonCache = new Map();

async function fetchJsonCached(url) {
    if (!url) throw new Error('fetchJsonCached: url is required');
    if (__jsonCache.has(url)) {
        return __jsonCache.get(url);
    }
    const p = (async () => {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Failed to load JSON ${url}: ${res.status}`);
        }
        return res.json();
    })();
    __jsonCache.set(url, p);
    try {
        return await p;
    } catch (e) {
        // On failure, remove cache entry to allow retry later
        __jsonCache.delete(url);
        throw e;
    }
}

// Global configuration object shared across modules
let mainConfig = {};

// Global i18n object for translations
let i18nData = {};

// In-memory cache for file modified dates to avoid repeated network calls
// Map<filePath, { mtime: number, cachedAt: number }>
const __modifiedDateCache = new Map();

function __loadModifiedDateCacheFromSession() {
    try {
        const raw = sessionStorage.getItem('modifiedDateCache:v1');
        if (!raw) return;
        const obj = JSON.parse(raw);
        Object.keys(obj).forEach((k) => {
            __modifiedDateCache.set(k, obj[k]);
        });
    } catch (e) {
        // ignore parse errors
    }
}

function __persistModifiedDateCacheToSession() {
    try {
        const obj = {};
        __modifiedDateCache.forEach((v, k) => { obj[k] = v; });
        sessionStorage.setItem('modifiedDateCache:v1', JSON.stringify(obj));
    } catch (e) {
        // ignore quota errors
    }
}

// Initialize cache from session on load
__loadModifiedDateCacheFromSession();

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
        mainConfig = await fetchJsonCached(configPath);
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
        const now = Date.now();
        const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

        // 1) Check in-memory/session cache first
        const cached = __modifiedDateCache.get(filePath);
        if (cached && typeof cached.mtime === 'number' && typeof cached.cachedAt === 'number' && (now - cached.cachedAt) < TTL_MS) {
            return new Date(cached.mtime);
        }
        
        // 2) If hosted on GitHub Pages, try GitHub API (may be slow, but we'll cache the result)
        if (isGitHubPages()) {
            const gitHubDate = await getGitHubCommitDate(filePath);
            if (gitHubDate && !isNaN(gitHubDate.getTime())) {
                __modifiedDateCache.set(filePath, { mtime: gitHubDate.getTime(), cachedAt: now });
                __persistModifiedDateCacheToSession();
                return gitHubDate;
            }
        }
        
        // 3) Fallback to HTTP Last-Modified header
        const headResponse = await fetch(fullPath, { method: 'HEAD' });
        if (headResponse.ok) {
            const lastModified = headResponse.headers.get('Last-Modified');
            if (lastModified) {
                const dt = new Date(lastModified);
                if (!isNaN(dt.getTime())) {
                    __modifiedDateCache.set(filePath, { mtime: dt.getTime(), cachedAt: now });
                    __persistModifiedDateCacheToSession();
                    return dt;
                }
            }
        }
        
        // 4) Default
        return new Date('1970-01-01');
    } catch (error) {
        console.warn(`Failed to get modified date for ${filePath}:`, error);
        return new Date('1970-01-01');
    }
}

/**
 * Get available languages from i18n directory
 * @returns {Array<string>} - Array of available language codes
 */
function getAvailableLanguages() {
    return ['en', 'es', 'ko'];
}

/**
 * Detect browser's preferred language and return available language or fallback to English
 * @returns {string} - Language code (en, es, ko)
 */
function detectBrowserLanguage() {
    const availableLanguages = getAvailableLanguages();
    
    // Get browser's preferred languages
    const browserLanguages = navigator.languages || [navigator.language || navigator.userLanguage || 'en'];
    
    // Check each browser language preference
    for (const browserLang of browserLanguages) {
        // Extract language code (e.g., 'ko-KR' -> 'ko', 'en-US' -> 'en')
        const langCode = browserLang.split('-')[0].toLowerCase();
        
        // Check if this language is available
        if (availableLanguages.includes(langCode)) {
            console.log(`Browser language detected: ${langCode}`);
            return langCode;
        }
    }
    
    // Fallback to English if no browser language is available
    console.log('No matching browser language found, falling back to English');
    return 'en';
}

/**
 * Load i18n data for the specified language
 * @param {string} language - Language code (ko, en, es)
 * @param {string} basePath - Base path for the i18n files (optional, defaults to current directory)
 * @returns {Promise<Object>} - Promise that resolves to the loaded i18n data
 */
async function loadI18nData(language = 'ko', basePath = '') {
    const i18nPath = basePath ? `${basePath}/properties/i18n/${language}.json` : `properties/i18n/${language}.json`;
    
    try {
        i18nData = await fetchJsonCached(i18nPath);
        console.log(`I18n data loaded successfully for language: ${language}`);
        return i18nData;
    } catch (error) {
        console.error(`Error loading i18n data for ${language}:`, error);
        // Fallback to English if other language fails
        if (language !== 'en') {
            console.log('Falling back to English language');
            return await loadI18nData('en', basePath);
        }
        throw error;
    }
}

/**
 * Flexible date parser supporting multiple formats
 * Supported: YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD, YYYYMMDD, DD/MM/YYYY (pref), MM/DD/YYYY (ambiguous), and native Date parse
 * @param {string|number|Date} dateInput
 * @returns {Date|null}
 */
function parseFlexibleDate(dateInput) {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
    const s = String(dateInput).trim();
    if (!s) return null;

    // ISO-like YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }

    // YYYY.MM.DD
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(s)) {
        const [y, m, d] = s.split('.').map(x => parseInt(x, 10));
        const dt = new Date(y, m - 1, d);
        return isNaN(dt.getTime()) ? null : dt;
    }

    // YYYY/MM/DD
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(s)) {
        const [y, m, d] = s.split('/').map(x => parseInt(x, 10));
        const dt = new Date(y, m - 1, d);
        return isNaN(dt.getTime()) ? null : dt;
    }

    // YYYYMMDD
    if (/^\d{8}$/.test(s)) {
        const y = parseInt(s.slice(0, 4), 10);
        const m = parseInt(s.slice(4, 6), 10);
        const d = parseInt(s.slice(6, 8), 10);
        const dt = new Date(y, m - 1, d);
        return isNaN(dt.getTime()) ? null : dt;
    }

    // DD/MM/YYYY or MM/DD/YYYY (prefer DD/MM/YYYY; if DD > 12, definite)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
        const [a, b, c] = s.split('/').map(x => parseInt(x, 10));
        const dd = a;
        const mm = b;
        const yy = c;
        const dt = new Date(yy, mm - 1, dd);
        return isNaN(dt.getTime()) ? null : dt;
    }

    // Fallback to native Date
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Locale-based date formatter (date only)
 * Uses browser locale via navigator.language
 * @param {Date} date
 * @param {Object} options - Intl.DateTimeFormat options override
 * @returns {string}
 */
function formatDateLocale(date, options = { year: 'numeric', month: '2-digit', day: '2-digit' }) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const locale = navigator.language || undefined;
    return date.toLocaleDateString(locale, options);
}

/**
 * Get translated text for the given key
 * @param {string} key - The i18n key
 * @param {Object} params - Parameters for template substitution (optional)
 * @returns {string} - Translated text or the key if not found
 */
function t(key, params = {}) {
    let text = i18nData[key] || key;
    
    // Replace template parameters
    if (params && typeof text === 'string') {
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });
    }
    
    return text;
}

/**
 * Apply i18n translations to elements with [data-i18n] attribute
 * Centralized utility to avoid duplication in main.js and viewer.js
 */
function applyI18nTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });
}

/**
 * Get translated text with fallback to main-config.json
 * For specific keys (main_title, main_subtitle, site_label_name), 
 * use i18n value if available, otherwise fallback to main-config.json
 * @param {string} key - The i18n key
 * @param {string} configKey - The corresponding key in main-config.json
 * @param {Object} params - Parameters for template substitution (optional)
 * @returns {string} - Translated text or fallback value
 */
function tWithFallback(key, configKey, params = {}) {
    // Check if i18n data has the key and it's not empty
    if (i18nData && i18nData[key] && String(i18nData[key]).trim() !== '') {
        let text = String(i18nData[key]);
        
        // Replace template parameters
        if (params && typeof text === 'string') {
            Object.keys(params).forEach(param => {
                text = text.replace(`{${param}}`, params[param]);
            });
        }
        
        return text;
    }
    
    // Fallback to main-config.json value
    if (mainConfig && mainConfig[configKey]) {
        let text = String(mainConfig[configKey]);
        
        // Replace template parameters
        if (params && typeof text === 'string') {
            Object.keys(params).forEach(param => {
                text = text.replace(`{${param}}`, params[param]);
            });
        }
        
        return text;
    }
    
    // Final fallback to the key itself
    return key;
}
// Theme mode management shared by main and viewer
async function setDarkMode(on) {
    // Base class and storage
    if (on) {
        document.body.classList.add('darkmode');
        try { sessionStorage.setItem('theme_mode', 'dark'); } catch (e) {}
        const toggle = document.getElementById('darkmode-toggle');
        if (toggle) toggle.innerText = t('btn_light_mode');
    } else {
        document.body.classList.remove('darkmode');
        try { sessionStorage.setItem('theme_mode', 'light'); } catch (e) {}
        const toggle = document.getElementById('darkmode-toggle');
        if (toggle) toggle.innerText = t('btn_dark_mode');
    }

    // Viewer-specific assets (present only in viewer.html)
    const mdLight = document.getElementById('md-light');
    const mdDark = document.getElementById('md-dark');
    const hlLight = document.getElementById('highlight-light');
    const hlDark = document.getElementById('highlight-dark');
    if (mdLight && mdDark && hlLight && hlDark) {
        if (on) {
            mdLight.disabled = true; mdDark.disabled = false;
            hlLight.disabled = true; hlDark.disabled = false;
        } else {
            mdLight.disabled = false; mdDark.disabled = true;
            hlLight.disabled = false; hlDark.disabled = true;
        }
    }
}

function bindDarkModeButton() {
    const btn = document.getElementById('darkmode-toggle');
    if (!btn) return;
    btn.onclick = () => {
        setDarkMode(!document.body.classList.contains('darkmode'));
    };
}
