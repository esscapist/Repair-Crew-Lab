let currentUser = null;
const BACKEND_URL = 'http://26.85.237.69:5000';

const homePage = document.getElementById('homePage');
const aboutPage = document.getElementById('aboutPage');
const contactsPage = document.getElementById('contactsPage');
const profilePage = document.getElementById('profilePage');

async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
    };
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
        const text = await response.text();
        const result = text ? JSON.parse(text) : {};
        if (!response.ok) {
            return { success: false, message: result.message || `Ошибка ${response.status}` };
        }
        return { success: true, ...result };
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: error.message };
    }
}

function hideAllPages() {
    if (homePage) homePage.style.display = 'none';
    if (aboutPage) aboutPage.style.display = 'none';
    if (contactsPage) contactsPage.style.display = 'none';
    if (profilePage) profilePage.style.display = 'none';
}

function showHomePage() { hideAllPages(); if (homePage) homePage.style.display = 'block'; }
function showAboutPage() { hideAllPages(); if (aboutPage) aboutPage.style.display = 'block'; }
function showContactsPage() { hideAllPages(); if (contactsPage) contactsPage.style.display = 'block'; }

function showProfilePage() {
    console.log('showProfilePage вызван, currentUser:', currentUser);
    if (!currentUser) {
        alert('Пожалуйста, войдите в систему');
        window.location.href = 'login.html';
        return;
    }
    hideAllPages();
    if (profilePage) profilePage.style.display = 'block';
    updateProfileUI();
    initCreditCalculator();
    loadCreditHistory();
}

function updateUI() {
    const authBtnContainer = document.getElementById('authBtnContainer');
    if (!authBtnContainer) return;

    if (currentUser) {
        authBtnContainer.innerHTML = `
            <div class="d-flex gap-2">
                <a class="nav-link btn btn-outline-warning text-white" href="#" id="profileBtn" style="border-color: #FFB347;">
                    <i class="fas fa-user-circle me-1"></i>${currentUser.fullName || currentUser.email.split('@')[0]}
                </a>
                <a class="nav-link btn btn-danger text-white" href="#" id="logoutBtn" style="border-color: #dc3545;">
                    Выход
                </a>
            </div>
        `;

        document.getElementById('profileBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            showProfilePage();
        });

        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            currentUser = null;
            window.location.href = 'index.html';
        });
    } else {
        authBtnContainer.innerHTML = `
            <div class="d-flex gap-2">
                <a class="nav-link btn btn-outline-warning text-white" href="login.html" style="border-color: #FFB347;">Вход</a>
                <a class="nav-link btn btn-outline-warning text-white" href="register.html" style="border-color: #FFB347;">Регистрация</a>
            </div>
        `;
    }
}

function updateProfileUI() {
    if (!currentUser) return;

    const nameEl = document.getElementById('profileFullName');
    const emailEl = document.getElementById('profileEmail');
    const idEl = document.getElementById('profileId');
    if (nameEl) nameEl.textContent = currentUser.fullName || currentUser.name || currentUser.email;
    if (emailEl) emailEl.textContent = currentUser.email;
    const storageKey = `user_id_${currentUser.email}`;
    let userId = localStorage.getItem(storageKey);

    if (!userId) {
        userId = 'RCL' + Math.floor(Math.random() * 100000);
        localStorage.setItem(storageKey, userId);
    }

    if (idEl) idEl.textContent = userId;
}

function calculateMonthlyPayment(amount, months, rate = 3.9) {
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return amount / months;
    return amount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
}

function initCreditCalculator() {
    const amountSlider = document.getElementById('creditAmount');
    const amountInput = document.getElementById('creditAmountValue');
    const termSelect = document.getElementById('creditTerm');
    const monthlyPaymentSpan = document.getElementById('monthlyPayment');
    const displayAmountSpan = document.getElementById('displayAmount');
    const totalOverpaySpan = document.getElementById('totalOverpay');
    if (!amountSlider) return;

    function updateCalculation() {
        let amount = parseInt(amountSlider.value);
        const months = parseInt(termSelect.value);
        amountSlider.value = amount;
        if (amountInput) amountInput.value = amount;
        const monthlyPayment = calculateMonthlyPayment(amount, months);
        const totalPayment = monthlyPayment * months;
        const overpay = totalPayment - amount;
        if (monthlyPaymentSpan) monthlyPaymentSpan.textContent = Math.round(monthlyPayment).toLocaleString() + ' ₽';
        if (displayAmountSpan) displayAmountSpan.textContent = amount.toLocaleString() + ' ₽';
        if (totalOverpaySpan) totalOverpaySpan.textContent = Math.round(overpay).toLocaleString() + ' ₽';
    }

    amountSlider.addEventListener('input', (e) => { if (amountInput) amountInput.value = e.target.value; updateCalculation(); });
    if (amountInput) amountInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value);
        if (isNaN(value)) value = 10000;
        value = Math.max(10000, Math.min(2000000, value));
        amountSlider.value = value;
        updateCalculation();
    });
    termSelect.addEventListener('change', updateCalculation);
    updateCalculation();
}

async function saveCreditRequest(requestData) {
    if (!currentUser) return null;

    const request = {
        userEmail: currentUser.email,
        userId: currentUser.id,
        userName: currentUser.fullName || currentUser.email,
        amount: requestData.amount,
        term: requestData.term,
        monthlyPayment: requestData.monthlyPayment,
        rate: requestData.rate,
        status: 'pending',
        date: new Date().toISOString()
    };

    const result = await apiRequest('/api/credit-request', 'POST', request);
    return result.success ? result : null;
}

async function loadCreditHistory() {
    if (!currentUser) return;
    const historyDiv = document.getElementById('creditHistory');
    const requestsList = document.getElementById('creditRequestsList');
    if (!historyDiv || !requestsList) return;

    const result = await apiRequest(`/api/credit-requests/${currentUser.email}`, 'GET');
    if (result.success && result.data && result.data.length > 0) {
        historyDiv.style.display = 'block';
        requestsList.innerHTML = result.data.slice(-5).reverse().map(req => {
            let statusClass = req.status === 'pending' ? 'bg-warning text-dark' : (req.status === 'approved' ? 'bg-success' : 'bg-danger');
            let statusText = req.status === 'pending' ? 'На рассмотрении' : (req.status === 'approved' ? 'Одобрен' : 'Отклонен');
            return `<div class="border-bottom pb-2 mb-2"><div class="d-flex justify-content-between"><div><strong>${Number(req.amount).toLocaleString()} ₽</strong> на ${req.term} мес.</div><span class="badge ${statusClass}">${statusText}</span></div><small>${new Date(req.date).toLocaleDateString()}</small></div>`;
        }).join('');
    } else {
        historyDiv.style.display = 'none';
    }
}

function setupNavigation() {
    document.getElementById('navHome')?.addEventListener('click', (e) => { e.preventDefault(); showHomePage(); });
    document.getElementById('navAbout')?.addEventListener('click', (e) => { e.preventDefault(); showAboutPage(); });
    document.getElementById('navContacts')?.addEventListener('click', (e) => { e.preventDefault(); showContactsPage(); });
}

function setupCreditForm() {
    const creditForm = document.getElementById('creditRequestForm');
    if (!creditForm) {
        console.log('Форма кредита не найдена');
        return;
    }

    creditForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Форма отправлена, currentUser:', currentUser);

        if (!currentUser) {
            alert('⚠️ Пожалуйста, войдите в систему');
            window.location.href = 'login.html';
            return;
        }

        const amount = parseInt(document.getElementById('creditAmount').value);
        const term = parseInt(document.getElementById('creditTerm').value);
        const monthlyPayment = document.getElementById('monthlyPayment').textContent;

        console.log('Данные кредита:', { amount, term, monthlyPayment });

        if (confirm(`Отправить заявку?\n ${amount.toLocaleString()} ₽ на ${term} мес.\n Платеж: ${monthlyPayment}`)) {
            const result = await saveCreditRequest({ amount, term, monthlyPayment, rate: 3.9 });
            if (result) {
                alert('Заявка отправлена!');
                await loadCreditHistory();
            } else {
                alert('Ошибка при отправке заявки');
            }
        }
    });
}

function setupContactForm() {
    const sendBtn = document.querySelector('.contact-send-btn');
    if (!sendBtn) return;

    sendBtn.addEventListener('click', async () => {
        const name = document.getElementById('contactName')?.value;
        const email = document.getElementById('contactEmail')?.value;
        const message = document.getElementById('contactMessage')?.value;
        if (!name || !email || !message) { alert('Заполните все поля'); return; }
        const result = await apiRequest('/api/contact', 'POST', { name, email, message });
        alert(result.success ? 'Сообщение отправлено!' : 'Ошибка');
        if (result.success) {
            if (document.getElementById('contactName')) document.getElementById('contactName').value = '';
            if (document.getElementById('contactEmail')) document.getElementById('contactEmail').value = '';
            if (document.getElementById('contactMessage')) document.getElementById('contactMessage').value = '';
        }
    });
}

function loadUserFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const userEncoded = urlParams.get('user');
    if (userEncoded) {
        try {
            currentUser = JSON.parse(atob(userEncoded));
            window.history.replaceState({}, document.title, window.location.pathname);
            console.log('Пользователь загружен из URL:', currentUser);
        } catch(e) { console.error('Ошибка декодирования:', e); }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен');
    loadUserFromURL();
    setupNavigation();
    setupContactForm();
    setupCreditForm();
    updateUI();

    if (currentUser) {
        console.log('Пользователь авторизован:', currentUser);
        updateProfileUI();
        initCreditCalculator();
        loadCreditHistory();
    } else {
        console.log('Пользователь не авторизован');
        initCreditCalculator();
    }

    showHomePage();
});
