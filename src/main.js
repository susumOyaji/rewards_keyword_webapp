const WORKER_GET_URL = 'https://rewards-keyword-worker.sumitomo0210.workers.dev/get';
const WORKER_SAVE_URL = 'https://rewards-keyword-worker.sumitomo0210.workers.dev/save';
const BLOG_URL = 'https://yoshizo.hatenablog.com/entry/microsoft-rewards-search-keyword-list/';
// Using a CORS proxy to allow fetching the blog content from the browser.
// Without this, the browser will block the request to the blog.
// const PROXY_URL = 'https://api.allorigins.win/raw?url='; // This is now a fallback

async function fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok || response.status === 404) return response;
            if (i < retries - 1) {
                console.warn(`Fetch failed with status ${response.status}. Retrying in ${backoff}ms... (${i + 1}/${retries})`);
                await new Promise(r => setTimeout(r, backoff));
                backoff *= 2;
            } else {
                return response;
            }
        } catch (err) {
            if (i < retries - 1) {
                console.warn(`Fetch error: ${err.message}. Retrying in ${backoff}ms... (${i + 1}/${retries})`);
                await new Promise(r => setTimeout(r, backoff));
                backoff *= 2;
            } else {
                throw err;
            }
        }
    }
}


let fetchedKeywords = {};
let userKeywords = {};
let selectedCategory = null;
let rawJsonResponse = '';
let searchQuery = '';
let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
const MAX_HISTORY = 30;

document.addEventListener('DOMContentLoaded', () => {
    initialize();
    setupEventListeners();
    setupModalResize();
});

function setupEventListeners() {
    document.getElementById('category-select').addEventListener('change', (e) => {
        selectedCategory = e.target.value;
    });

    document.getElementById('add-btn').addEventListener('click', addKeyword);
    document.getElementById('save-btn').addEventListener('click', saveKeywordsToKV);

    const searchInput = document.getElementById('keyword-search');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        render();
        if (searchQuery) {
            renderSearchHistory(searchQuery);
        } else {
            renderSearchHistory();
        }
    });

    searchInput.addEventListener('focus', () => {
        renderSearchHistory(searchQuery);
        document.getElementById('search-history').classList.remove('hidden');
    });

    searchInput.addEventListener('blur', () => {
        // Delay to allow clicking history items
        setTimeout(() => {
            document.getElementById('search-history').classList.add('hidden');
        }, 200);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            addToSearchHistory(searchQuery.trim());
            document.getElementById('search-history').classList.add('hidden');
        }
    });

    // Dark mode toggle
    const darkModeBtn = document.getElementById('dark-mode-btn');
    darkModeBtn.addEventListener('click', toggleDarkMode);

    // Load preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    updateDarkModeIcon();
}

function setupModalResize() {
    const modal = document.getElementById('edit-category-modal');
    const dialog = document.getElementById('modal-dialog');
    const resizeHandle = document.getElementById('modal-resize-handle');
    
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    const onResizeStart = (e) => {
        isResizing = true;
        startX = e.clientX || e.touches?.[0]?.clientX || 0;
        startY = e.clientY || e.touches?.[0]?.clientY || 0;
        startWidth = dialog.offsetWidth;
        startHeight = dialog.offsetHeight;
        document.addEventListener('mousemove', onResizeMove);
        document.addEventListener('touchmove', onResizeMove);
        document.addEventListener('mouseup', onResizeEnd);
        document.addEventListener('touchend', onResizeEnd);
    };

    const onResizeMove = (e) => {
        if (!isResizing) return;
        const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
        const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        const newWidth = Math.max(300, startWidth + deltaX);
        const newHeight = Math.max(200, startHeight + deltaY);
        
        dialog.style.width = newWidth + 'px';
        dialog.style.height = newHeight + 'px';
    };

    const onResizeEnd = () => {
        isResizing = false;
        document.removeEventListener('mousemove', onResizeMove);
        document.removeEventListener('touchmove', onResizeMove);
        document.removeEventListener('mouseup', onResizeEnd);
        document.removeEventListener('touchend', onResizeEnd);
    };

    resizeHandle.addEventListener('mousedown', onResizeStart);
    resizeHandle.addEventListener('touchstart', onResizeStart);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    updateDarkModeIcon();
}

function updateDarkModeIcon() {
    const btn = document.getElementById('dark-mode-btn');
    const isDark = document.body.classList.contains('dark-mode');

    // Sun Icon (for Light Mode -> switch to Dark) or Moon Icon (for Dark Mode -> switch to Light)?
    // Usually: Show Moon when in Light Mode (to indicate "Night Mode"), Show Sun when in Dark Mode (to indicate "Day Mode").
    // Let's stick to: Show what it IS or what it WILL BE?
    // User said "Button doesn't become Moon". 
    // If currently Light, button is Sun (default). User wants it to change.
    // Let's implement: Light Mode = Moon Icon (click to go dark), Dark Mode = Sun Icon (click to go light).

    if (isDark) {
        // Show Sun (to switch to light)
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>';
        btn.title = "Switch to Light Mode";
    } else {
        // Show Moon (to switch to dark)
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2z"/></svg>';
        btn.title = "Switch to Dark Mode";
    }
}

async function initialize() {
    showLoading(true);
    hideError();
    try {
        await Promise.all([fetchUserKeywords(), fetchAndParseWebKeywords()]);
        render();
    } catch (e) {
        showError(`起動エラー: ${e.message}`);
    } finally {
        showLoading(false);
    }
}

async function fetchUserKeywords() {
    // まずローカルストレージから読み込む（バックアップ）
    try {
        const localData = localStorage.getItem('userKeywordsBackup');
        if (localData) {
            userKeywords = JSON.parse(localData);
            if (!userKeywords._categoryAliases) userKeywords._categoryAliases = {};
        }
    } catch(e) {}

    try {
        const response = await fetchWithRetry(WORKER_GET_URL);
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                
                // サーバーのデータとローカルデータをマージ（簡単な統合）
                if (!data._categoryAliases) data._categoryAliases = {};
                userKeywords._categoryAliases = { ...data._categoryAliases, ...(userKeywords._categoryAliases || {}) };
                
                for (const [cat, kws] of Object.entries(data)) {
                    if (cat === '_categoryAliases') continue;
                    if (!userKeywords[cat]) userKeywords[cat] = [];
                    kws.forEach(k => {
                        if (!userKeywords[cat].includes(k)) userKeywords[cat].push(k);
                    });
                }

                rawJsonResponse = JSON.stringify(userKeywords, null, 2);
                updateRawJsonDisplay();
                // 正常に取得できたらバックアップも更新
                localStorage.setItem('userKeywordsBackup', JSON.stringify(userKeywords));
            } else {
                const text = await response.text();
                rawJsonResponse = `Server returned non-JSON response:\n${text.substring(0, 500)}...`;
                updateRawJsonDisplay();
                throw new Error('Cloudflare Worker returned an invalid response (not JSON).');
            }
        } else if (response.status === 404) {
            rawJsonResponse = 'No data found on server (404).';
            updateRawJsonDisplay();
        } else {
            throw new Error(`Failed to load saved keywords: ${response.status}`);
        }
    } catch (e) {
        console.error('Error fetching user keywords:', e);
        rawJsonResponse = `Error connecting to keyword server: ${e.message}. Using local backup if available.`;
        updateRawJsonDisplay();
        // Don't block the app if user keywords fail, just log it
    }
}

async function fetchAndParseWebKeywords() {
    let htmlText = null;

    // --- Strategy 1: Use our own proxy (Cloudflare Function) ---
    try {
        const proxyUrl = `/proxy?url=${encodeURIComponent(BLOG_URL)}`;
        const response = await fetchWithRetry(proxyUrl);
        if (!response.ok) {
            throw new Error(`Self-proxy failed with status: ${response.status}`);
        }
        htmlText = await response.text();
        console.log("Fetched keywords using self-proxy.");
    } catch (e) {
        console.warn(`Self-proxy fetch failed: ${e.message}. Falling back to public proxy.`);
        
        // --- Strategy 2: Fallback to public proxy ---
        try {
            const fallbackProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(BLOG_URL)}`;
            const response = await fetchWithRetry(fallbackProxyUrl);
            if (!response.ok) {
                throw new Error(`Public proxy failed with status: ${response.status}`);
            }
            htmlText = await response.text();
            console.log("Fetched keywords using public fallback proxy.");
        } catch (e2) {
            console.error('All fetch methods failed:', e2);
            throw new Error(`Error fetching web keywords (both self-proxy and public proxy failed): ${e2.message}`);
        }
    }

    if (htmlText) {
        fetchedKeywords = parseKeywordsFromHtml(htmlText);
    }
}

function parseKeywordsFromHtml(htmlBody) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlBody, 'text/html');
    const fetched = {};

    const h3Elements = doc.querySelectorAll('h3');

    h3Elements.forEach(h3 => {
        let categoryNameText = h3.textContent.trim();
        // Use content inside ( ) or （ ） as category name if present
        const match = categoryNameText.match(/[（\(](.*?)[）\)]/);
        const categoryName = match ? match[1].trim() : categoryNameText;
        const keywords = [];
        let currentElement = h3.nextElementSibling;
        let foundUl = null;

        while (currentElement) {
            if (currentElement.tagName.toLowerCase() === 'ul') {
                foundUl = currentElement;
                break;
            }
            if (currentElement.tagName.toLowerCase() === 'h3') break;

            const ulInDescendants = currentElement.querySelector('ul');
            if (ulInDescendants) {
                foundUl = ulInDescendants;
                break;
            }
            currentElement = currentElement.nextElementSibling;
        }

        if (foundUl) {
            const liElements = foundUl.querySelectorAll('li');
            liElements.forEach(li => {
                let text = li.textContent.trim();

                // Skip lines indicating they are no longer valid (NG)
                if (text.includes('NG')) return;

                // 1. Priority: Extract phrases inside 「 」 or 『 』 anywhere in the text
                // This handles cases like: ペット（「大切なペットをケア」「ペットを甘やかしましょう」)
                const quoteMatches = [...text.matchAll(/[「『](.*?)[」』]/g)];

                if (quoteMatches.length > 0) {
                    quoteMatches.forEach(m => {
                        const keyword = m[1].trim();
                        if (keyword) keywords.push(keyword);
                    });
                    return; // Found quotes, so we are done with this line
                }

                // 2. If no quotes, extract content inside ( ) or （ ）
                // This handles cases like: 2月のイベント（バレンタイン）
                const parenMatch = text.match(/[（\(](.*?)[）\)]/);
                if (parenMatch && !parenMatch[1].includes('例') && !parenMatch[1].includes('※') && !parenMatch[1].includes('時点')) {
                    text = parenMatch[1].trim();
                } else if (text.match(/[（\(].*?[）\)]/)) {
                    text = text.replace(/[（\(].*?[）\)]/g, '').trim();
                }

                // 3. Fallback: Split by commas/separators and cleanup
                const potentialKeywords = text.split(/[、,]\s*/);
                potentialKeywords.forEach(pk => {
                    let k = pk.trim();
                    // Cleanup leading numbers (e.g., "1. ")
                    k = k.replace(/^\d+\.\s*/, '').trim();
                    // Cleanup leading dashes (e.g., "- ")
                    k = k.replace(/^-+\s*/, '').trim();
                    // Remove any remaining example indicators like "例「"
                    k = k.replace(/^例[「『]/, '').trim();

                    if (k && k.length < 30) keywords.push(k); // avoid long descriptive sentences
                });
            });
        }

        if (keywords.length > 0) {
            fetched[categoryName] = keywords;
        }
    });

    return fetched;
}

function getOriginalCategoryName(displayName) {
    if (!userKeywords._categoryAliases) return displayName;
    for (const [orig, alias] of Object.entries(userKeywords._categoryAliases)) {
        if (alias === displayName) return orig;
    }
    return displayName;
}

function getDisplayKeywords() {
    const merged = {};
    const aliases = userKeywords._categoryAliases || {};

    // Copy fetched keywords
    for (const [category, keywords] of Object.entries(fetchedKeywords)) {
        const displayCategory = aliases[category] || category;
        if (!merged[displayCategory]) merged[displayCategory] = [];
        merged[displayCategory].push(...keywords);
    }

    // Merge user keywords
    for (const [category, keywords] of Object.entries(userKeywords)) {
        if (category === '_categoryAliases') continue;
        const displayCategory = aliases[category] || category;
        if (!merged[displayCategory]) merged[displayCategory] = [];
        
        const existingKeywords = merged[displayCategory];
        keywords.forEach(keyword => {
            if (!existingKeywords.includes(keyword)) {
                existingKeywords.push(keyword);
            }
        });
    }
    return merged;
}

function render() {
    let displayKeywords = getDisplayKeywords();

    // Filter keywords by search query
    if (searchQuery) {
        const filtered = {};
        for (const [category, keywords] of Object.entries(displayKeywords)) {
            const categoryMatch = category.toLowerCase().includes(searchQuery);
            const matchedKeywords = keywords.filter(k => k.toLowerCase().includes(searchQuery));

            if (categoryMatch) {
                // If category matches, show all its keywords
                filtered[category] = keywords;
            } else if (matchedKeywords.length > 0) {
                // If category doesn't match, only show matching keywords
                filtered[category] = matchedKeywords;
            }
        }
        displayKeywords = filtered;
    }

    const categories = Object.keys(displayKeywords);

    // Update Dropdown
    const select = document.getElementById('category-select');
    // Save current selection if valid
    const currentSelection = select.value;
    select.innerHTML = '<option value="" disabled>Category</option>';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });

    if (currentSelection && categories.includes(currentSelection)) {
        select.value = currentSelection;
        selectedCategory = currentSelection;
    } else if (categories.length > 0 && !selectedCategory) {
        select.value = categories[0];
        selectedCategory = categories[0];
    } else if (selectedCategory) {
        select.value = selectedCategory;
    }

    // Render List
    const listContainer = document.getElementById('keywords-list');
    listContainer.innerHTML = '';

    categories.forEach(category => {
        const keywords = displayKeywords[category];

        const card = document.createElement('div');
        card.className = 'category-card';

        const header = document.createElement('div');
        header.className = 'category-header';

        const titleContainer = document.createElement('div');
        titleContainer.className = 'category-title-container';

        const titleText = document.createElement('span');
        titleText.textContent = category;

        const editBtn = document.createElement('span');
        editBtn.className = 'edit-category-btn';
        editBtn.innerHTML = '✎';
        editBtn.title = 'カテゴリー名を編集';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            openEditCategoryModal(category);
        };

        titleContainer.appendChild(titleText);
        titleContainer.appendChild(editBtn);

        const icon = document.createElement('span');
        icon.className = 'toggle-icon';
        if (searchQuery) icon.classList.add('rotated');
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>'; // Down arrow

        header.appendChild(titleContainer);
        header.appendChild(icon);

        header.onclick = () => {
            const content = card.querySelector('.category-content');
            const iconSvg = header.querySelector('.toggle-icon');

            content.classList.toggle('hidden');
            iconSvg.classList.toggle('rotated');
        };

        const content = document.createElement('div');
        content.className = 'category-content';
        if (!searchQuery) content.classList.add('hidden');

        keywords.forEach(keyword => {
            const chip = document.createElement('div');
            chip.className = 'keyword-chip';

            const textSpan = document.createElement('span');
            textSpan.textContent = keyword;
            chip.appendChild(textSpan);

            chip.onclick = () => {
                copyToClipboard(keyword);
                // Visual feedback
                document.querySelectorAll('.keyword-chip').forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
            };

            // Check if it's a user keyword to show remove button
            const originalCategory = getOriginalCategoryName(category);
            if (userKeywords[originalCategory] && userKeywords[originalCategory].includes(keyword)) {
                const removeBtn = document.createElement('span');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.title = 'Remove keyword';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    removeKeyword(category, keyword);
                };
                chip.appendChild(removeBtn);
            }

            content.appendChild(chip);
        });

        card.appendChild(header);
        card.appendChild(content);
        listContainer.appendChild(card);
    });
}

function addKeyword() {
    const input = document.getElementById('keyword-input');
    const text = input.value.trim();

    if (text && selectedCategory) {
        const originalCategory = getOriginalCategoryName(selectedCategory);
        if (!userKeywords[originalCategory]) {
            userKeywords[originalCategory] = [];
        }

        if (!userKeywords[originalCategory].includes(text)) {
            userKeywords[originalCategory].push(text);
            render();
            saveKeywordsToKV(); // Auto save or wait for button? Dart app saves on add.
        }
        input.value = '';
    } else {
        if (!selectedCategory) alert('Please select a category first.');
    }
}

function removeKeyword(displayCategory, keyword) {
    const originalCategory = getOriginalCategoryName(displayCategory);
    if (userKeywords[originalCategory]) {
        userKeywords[originalCategory] = userKeywords[originalCategory].filter(k => k !== keyword);
        if (userKeywords[originalCategory].length === 0) {
            delete userKeywords[originalCategory];
        }
        render();
        saveKeywordsToKV();
    }
}

function openEditCategoryModal(category) {
    const modal = document.getElementById('edit-category-modal');
    const input = document.getElementById('modal-input');
    const okBtn = document.getElementById('modal-ok-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const closeBtn = document.getElementById('modal-close-btn');

    input.value = category;
    input.focus();
    modal.classList.remove('hidden');

    const handleSave = () => {
        const newName = input.value.trim();
        const originalCategory = getOriginalCategoryName(category);
        userKeywords._categoryAliases = userKeywords._categoryAliases || {};
        
        if (newName === '') {
            delete userKeywords._categoryAliases[originalCategory];
            selectedCategory = originalCategory;
        } else if (newName !== category) {
            userKeywords._categoryAliases[originalCategory] = newName;
            selectedCategory = newName;
        }
        
        modal.classList.add('hidden');
        render();
        saveKeywordsToKV();
    };

    const handleClose = () => {
        modal.classList.add('hidden');
    };

    okBtn.onclick = handleSave;
    cancelBtn.onclick = handleClose;
    closeBtn.onclick = handleClose;

    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleClose();
        }
    };

    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) {
            handleClose();
        }
    };
}

async function saveKeywordsToKV() {
    // サーバーエラー時に備えて、常にブラウザのローカルにも保存しておく
    localStorage.setItem('userKeywordsBackup', JSON.stringify(userKeywords));

    try {
        const response = await fetch(WORKER_SAVE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userKeywords)
        });

        if (response.ok) {
            showToast('保存しました (同期完了)');
        } else {
            throw new Error(`Server responded with ${response.status}`);
        }
    } catch (e) {
        console.warn(`Error saving keywords to KV: ${e.message}`);
        // エラーのポップアップ（alert）は出さず、画面下のトースト通知だけで知らせる
        showToast('ローカルに保存しました (サーバー通信エラー)');
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard');
    });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function showLoading(isLoading) {
    const indicator = document.getElementById('loading-indicator');
    if (isLoading) indicator.classList.remove('hidden');
    else indicator.classList.add('hidden');
}

function showError(msg) {
    const el = document.getElementById('error-message');
    el.innerHTML = `
        <div>${msg}</div>
        <button onclick="initialize()" style="margin-top: 10px; padding: 8px 16px; border-radius: 4px; background: #2196F3; color: white; border: none; cursor: pointer;">
            再試行 (Retry)
        </button>
    `;
    el.classList.remove('hidden');
}

function hideError() {
    const el = document.getElementById('error-message');
    el.classList.add('hidden');
}

function updateRawJsonDisplay() {
    document.getElementById('raw-json-display').textContent = rawJsonResponse;
}

function addToSearchHistory(query) {
    if (!query) return;
    // Remove if already exists to move to top
    searchHistory = searchHistory.filter(item => item.toLowerCase() !== query.toLowerCase());
    searchHistory.unshift(query);
    // Limit history size
    if (searchHistory.length > MAX_HISTORY) {
        searchHistory = searchHistory.slice(0, MAX_HISTORY);
    }
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
}

function removeFromSearchHistory(query) {
    searchHistory = searchHistory.filter(item => item !== query);
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    renderSearchHistory(searchQuery);
}

function renderSearchHistory(filter = '') {
    const container = document.getElementById('search-history');
    container.innerHTML = '';

    const displayHistory = filter
        ? searchHistory.filter(item => item.toLowerCase().includes(filter.toLowerCase()))
        : searchHistory;

    if (displayHistory.length === 0) {
        container.classList.add('hidden');
        return;
    }

    displayHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';

        div.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
            </svg>
            <span class="history-text">${item}</span>
            <span class="remove-history" title="Remove from history">
                <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 24 24" width="18">
                    <path d="M0 0h24v24H0z" fill="none"/>
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </span>
        `;

        div.querySelector('.history-text').onclick = () => {
            const searchInput = document.getElementById('keyword-search');
            searchInput.value = item;
            searchQuery = item.toLowerCase();
            render();
            addToSearchHistory(item); // Move to top
            container.classList.add('hidden');
        };

        div.querySelector('.remove-history').onclick = (e) => {
            e.stopPropagation();
            removeFromSearchHistory(item);
        };

        container.appendChild(div);
    });

    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
    }
}
