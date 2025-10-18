// グローバル変数
let customers = [];
let recognition = null;
let pendingCustomer = null;
let duplicateCustomerId = null;
let openaiApiKey = null;
let editingCustomerId = null;

// API基底URL
const API_BASE = '/api';

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    // LocalStorageからAPIキーを読み込む
    openaiApiKey = localStorage.getItem('openai_api_key');
    if (openaiApiKey) {
        document.getElementById('apiKey').value = openaiApiKey;
        updateApiStatus();
    }

    // 顧客データを読み込む
    loadCustomers();

    // 音声認識の初期化
    initSpeechRecognition();
});

// APIキーの監視
document.getElementById('apiKey').addEventListener('input', (e) => {
    openaiApiKey = e.target.value.trim();
    if (openaiApiKey) {
        localStorage.setItem('openai_api_key', openaiApiKey);
    } else {
        localStorage.removeItem('openai_api_key');
    }
    updateApiStatus();
});

function updateApiStatus() {
    const status = document.getElementById('apiStatus');
    if (openaiApiKey && openaiApiKey.startsWith('sk-')) {
        status.textContent = '接続準備完了';
        status.className = 'api-status connected';
    } else {
        status.textContent = '未接続';
        status.className = 'api-status disconnected';
    }
}

// 音声認識の初期化
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.continuous = false;
        recognition.interimResults = false;
    }
}

// タブ切り替え
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');

    // 顧客リストタブに切り替えたら再読み込み
    if (tabName === 'customer-list') {
        loadCustomers();
    }
}

// 音声入力開始
function startVoice() {
    if (!recognition) {
        alert('お使いのブラウザは音声認識に対応していません。Chrome、Edge、Safariをご利用ください。');
        return;
    }

    const input = document.getElementById('inputText');
    const btn = event.target;

    btn.classList.add('listening');

    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        input.value += (input.value ? '\n' : '') + transcript;
        btn.classList.remove('listening');
    };

    recognition.onerror = () => {
        btn.classList.remove('listening');
        alert('音声認識エラーが発生しました。もう一度お試しください。');
    };

    recognition.onend = () => {
        btn.classList.remove('listening');
    };

    recognition.start();
}

// OpenAI APIでAI解析
async function analyzeWithAI(text) {
    if (!openaiApiKey || !openaiApiKey.startsWith('sk-')) {
        throw new Error('有効なOpenAI APIキーを入力してください');
    }

    const prompt = `あなたはホストクラブの顧客管理システムのAIアシスタントです。以下の顧客情報を解析し、JSON形式で構造化してください。

顧客情報:
${text}

以下のJSON形式で返してください(該当しない項目は省略):
{
  "name": "顧客の名前(必須)",
  "data": {
    "年齢": "年齢",
    "電話番号": "電話番号",
    "職業": "職業",
    "好きなお酒": "好きなお酒",
    "趣味": "趣味",
    "出身": "出身地",
    "好み": "その他の好みや嗜好",
    "性格": "性格の特徴",
    "予算感": "推定予算感",
    "来店頻度": "来店頻度の予測"
  },
  "aiInsights": "この顧客への接客アドバイス、おすすめのアプローチ方法、注意点など(200文字程度)"
}

名前が明確でない場合は、推測して設定してください。`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'あなたはホストクラブの顧客管理を支援するAIです。顧客情報を構造化し、接客に役立つインサイトを提供します。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API呼び出しに失敗しました');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
        name: result.name,
        data: {
            ...result.data,
            '入力情報': text
        },
        aiInsights: result.aiInsights
    };
}

// 入力処理
async function processInput() {
    const text = document.getElementById('inputText').value.trim();
    const submitBtn = document.getElementById('submitBtn');

    if (!text) {
        alert('情報を入力してください。');
        return;
    }

    if (!openaiApiKey || !openaiApiKey.startsWith('sk-')) {
        alert('OpenAI APIキーを入力してください。\n\nAPIキーは https://platform.openai.com/api-keys から取得できます。');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'AI解析中...';

    try {
        const info = await analyzeWithAI(text);

        if (!info.name) {
            alert('お客様のお名前が認識できませんでした。');
            return;
        }

        // 同名チェック
        const existingCustomer = customers.find(c => c.name === info.name);

        if (existingCustomer) {
            pendingCustomer = info;
            duplicateCustomerId = existingCustomer.id;
            document.getElementById('duplicateModal').classList.add('active');
        } else {
            await saveCustomer(info);
        }
    } catch (error) {
        alert('AI解析エラー: ' + error.message + '\n\nAPIキーが正しいか確認してください。');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = '🤖 AIで解析して登録';
    }
}

// 顧客データを読み込む
async function loadCustomers() {
    try {
        const response = await fetch(`${API_BASE}/customers`);
        if (response.ok) {
            customers = await response.json();
            displayCustomers();
        } else {
            console.error('Failed to load customers');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// 顧客保存
async function saveCustomer(info, idNumber = null) {
    const customer = {
        name: info.name,
        idNumber: idNumber,
        data: info.data,
        aiInsights: info.aiInsights || null,
        registeredAt: new Date().toLocaleString('ja-JP'),
        updatedAt: null
    };

    try {
        const response = await fetch(`${API_BASE}/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customer)
        });

        if (response.ok) {
            await loadCustomers();
            document.getElementById('inputText').value = '';
            alert('✅ お客様情報を登録しました!');
        } else {
            const error = await response.json();
            alert('登録に失敗しました: ' + error.error);
        }
    } catch (error) {
        alert('エラーが発生しました: ' + error.message);
    }
}

// 重複処理
async function handleDuplicate(action) {
    if (action === 'new') {
        const count = customers.filter(c => c.name === pendingCustomer.name).length;
        await saveCustomer(pendingCustomer, count + 1);
    } else if (action === 'update') {
        const customer = customers.find(c => c.id === duplicateCustomerId);
        const updatedCustomer = {
            name: customer.name,
            idNumber: customer.idNumber,
            data: {
                ...customer.data,
                ...pendingCustomer.data
            },
            aiInsights: pendingCustomer.aiInsights || customer.aiInsights,
            registeredAt: customer.registeredAt,
            updatedAt: new Date().toLocaleString('ja-JP')
        };

        try {
            const response = await fetch(`${API_BASE}/customers/${duplicateCustomerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedCustomer)
            });

            if (response.ok) {
                await loadCustomers();
                alert('✅ お客様情報を更新しました!');
            } else {
                alert('更新に失敗しました');
            }
        } catch (error) {
            alert('エラーが発生しました: ' + error.message);
        }
    }

    closeDuplicateModal();
    document.getElementById('inputText').value = '';
}

function closeDuplicateModal() {
    document.getElementById('duplicateModal').classList.remove('active');
    pendingCustomer = null;
    duplicateCustomerId = null;
}

// 顧客リスト表示
function displayCustomers() {
    const list = document.getElementById('customerList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    const filtered = customers.filter(c => {
        const searchText = c.name.toLowerCase() + ' ' +
                          Object.values(c.data).join(' ').toLowerCase();
        return searchText.includes(searchTerm);
    });

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state">登録されているお客様がいません</div>';
        return;
    }

    list.innerHTML = filtered.map(customer => {
        const displayName = customer.idNumber
            ? `${customer.name} <span class="customer-id">#${customer.idNumber}</span>`
            : customer.name;

        const dataItems = Object.entries(customer.data)
            .filter(([key, value]) => key !== '入力情報')
            .map(([key, value]) => `
                <div class="info-item">
                    <span class="info-label">${key}</span>
                    <span class="info-value">${value}</span>
                </div>
            `).join('');

        const originalInfo = customer.data['入力情報'] ? `
            <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">入力情報</span>
                <span class="info-value">${customer.data['入力情報']}</span>
            </div>
        ` : '';

        const aiInsightsHtml = customer.aiInsights ? `
            <div class="ai-insights">
                <div class="ai-insights-title">
                    <span>🤖</span>
                    <span>AIインサイト</span>
                    <span class="ai-badge">AI分析</span>
                </div>
                <div class="ai-insights-content">${customer.aiInsights}</div>
            </div>
        ` : '';

        const cardClass = customer.aiInsights ? 'customer-card ai-analyzed' : 'customer-card';

        return `
            <div class="${cardClass}">
                <div class="customer-header">
                    <div class="customer-name">
                        ${displayName}
                        ${customer.aiInsights ? '<span class="ai-badge">AI</span>' : ''}
                    </div>
                    <div class="button-group">
                        <button class="edit-btn" onclick="editCustomer(${customer.id})">編集</button>
                        <button class="delete-btn" onclick="deleteCustomer(${customer.id})">削除</button>
                    </div>
                </div>
                <div class="customer-info">
                    ${dataItems}
                    ${originalInfo}
                </div>
                ${aiInsightsHtml}
                <div class="info-item" style="font-size: 0.8em; color: #999; margin-top: 10px;">
                    登録: ${customer.registeredAt}
                    ${customer.updatedAt ? `<br>更新: ${customer.updatedAt}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 検索
function searchCustomers() {
    displayCustomers();
}

// 顧客削除
async function deleteCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (customer && confirm(`本当に「${customer.name}」さんの情報を削除しますか?`)) {
        try {
            const response = await fetch(`${API_BASE}/customers/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadCustomers();
                alert('削除しました');
            } else {
                alert('削除に失敗しました');
            }
        } catch (error) {
            alert('エラーが発生しました: ' + error.message);
        }
    }
}

// 顧客編集
function editCustomer(id) {
    editingCustomerId = id;
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    const formHtml = `
        <div class="edit-form-group">
            <label>名前</label>
            <input type="text" id="editName" value="${customer.name}">
        </div>
        ${Object.entries(customer.data)
            .filter(([key]) => key !== '入力情報')
            .map(([key, value]) => `
                <div class="edit-form-group">
                    <label>${key}</label>
                    <input type="text" id="edit_${key}" value="${value || ''}">
                </div>
            `).join('')}
        <div class="edit-form-group">
            <label>入力情報</label>
            <textarea id="editOriginal">${customer.data['入力情報'] || ''}</textarea>
        </div>
        ${customer.aiInsights ? `
            <div class="edit-form-group">
                <label>AIインサイト</label>
                <textarea id="editInsights">${customer.aiInsights}</textarea>
            </div>
        ` : ''}
    `;

    document.getElementById('editForm').innerHTML = formHtml;
    document.getElementById('editModal').classList.add('active');
}

async function saveEdit() {
    const customer = customers.find(c => c.id === editingCustomerId);
    if (!customer) return;

    const updatedData = { ...customer.data };

    // データの更新
    Object.keys(customer.data).forEach(key => {
        if (key === '入力情報') {
            updatedData[key] = document.getElementById('editOriginal').value.trim();
        } else {
            const input = document.getElementById(`edit_${key}`);
            if (input) {
                updatedData[key] = input.value.trim();
            }
        }
    });

    const updatedCustomer = {
        name: document.getElementById('editName').value.trim(),
        idNumber: customer.idNumber,
        data: updatedData,
        aiInsights: document.getElementById('editInsights')?.value.trim() || customer.aiInsights,
        registeredAt: customer.registeredAt,
        updatedAt: new Date().toLocaleString('ja-JP')
    };

    try {
        const response = await fetch(`${API_BASE}/customers/${editingCustomerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedCustomer)
        });

        if (response.ok) {
            await loadCustomers();
            closeEditModal();
            alert('✅ 情報を更新しました');
        } else {
            alert('更新に失敗しました');
        }
    } catch (error) {
        alert('エラーが発生しました: ' + error.message);
    }
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editingCustomerId = null;
}
