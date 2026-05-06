const homePage = document.getElementById('homePage');
const aboutPage = document.getElementById('aboutPage');
const contactsPage = document.getElementById('contactsPage');
const profilePage = document.getElementById('profilePage');

function hideAllPages() {
    if (homePage) homePage.style.display = 'none';
    if (aboutPage) aboutPage.style.display = 'none';
    if (contactsPage) contactsPage.style.display = 'none';
    if (profilePage) profilePage.style.display = 'none';
}

function showHomePage() {
    hideAllPages();
    if (homePage) homePage.style.display = 'block';
}

function showAboutPage() {
    hideAllPages();
    if (aboutPage) aboutPage.style.display = 'block';
}

function showContactsPage() {
    hideAllPages();
    if (contactsPage) contactsPage.style.display = 'block';
}

function showProfilePage() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        // Если не авторизован - переходим на страницу входа
        window.location.href = 'login.html';
        return;
    }
    hideAllPages();
    if (profilePage) profilePage.style.display = 'block';
    updateProfileData();
}

// ========== 2. НАСТРОЙКА НАВИГАЦИИ ==========
function setupNavigation() {
    const navHome = document.getElementById('navHome');
    const navAbout = document.getElementById('navAbout');
    const navContacts = document.getElementById('navContacts');

    if (navHome) {
        navHome.addEventListener('click', (e) => {
            e.preventDefault();
            showHomePage();
        });
    }

    if (navAbout) {
        navAbout.addEventListener('click', (e) => {
            e.preventDefault();
            showAboutPage();
        });
    }

    if (navContacts) {
        navContacts.addEventListener('click', (e) => {
            e.preventDefault();
            showContactsPage();
        });
    }
}

function updateNavbarForAuth() {
    const navLinks = document.getElementById('navLinks');
    const currentUser = localStorage.getItem('currentUser');

    document.querySelectorAll('.dynamic-nav-item').forEach(el => el.remove());

    if (currentUser) {
        const user = JSON.parse(currentUser);

        const profileLi = document.createElement('li');
        profileLi.className = 'nav-item dynamic-nav-item';
        profileLi.innerHTML = `<a class="nav-link" href="#" id="profileNavLink"><i class="fas fa-user-circle me-1"></i>${user.fullName}</a>`;

        const logoutLi = document.createElement('li');
        logoutLi.className = 'nav-item dynamic-nav-item';
        logoutLi.innerHTML = '<a class="nav-link text-warning" href="#" id="logoutBtn">Выйти</a>';

        navLinks.appendChild(profileLi);
        navLinks.appendChild(logoutLi);

        document.getElementById('profileNavLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            showProfilePage();
        });

        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            updateNavbarForAuth();
            showHomePage();
        });
    } else {
        const loginLi = document.createElement('li');
        loginLi.className = 'nav-item dynamic-nav-item';
        loginLi.innerHTML = '<a class="nav-link" href="login.html" id="showLoginBtn">Вход</a>';

        const registerLi = document.createElement('li');
        registerLi.className = 'nav-item dynamic-nav-item';
        registerLi.innerHTML = '<a class="nav-link" href="register.html" id="showRegisterBtn">Регистрация</a>';

        navLinks.appendChild(loginLi);
        navLinks.appendChild(registerLi);
    }
}

function updateProfileData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const nameElement = document.getElementById('profileFullName');
        const emailElement = document.getElementById('profileEmail');
        if (nameElement) nameElement.textContent = currentUser.fullName;
        if (emailElement) emailElement.textContent = currentUser.email;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    updateNavbarForAuth();

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        updateProfileData();
    }

    showHomePage();
});

function loginUser(email, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            const currentUser = { id: user.id, fullName: user.fullName, email: user.email };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            return true;
        }
        return false;
    }

    // Обработка формы входа
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (loginUser(email, password)) {
            // Успешный вход - переходим на главную
            window.location.href = 'index.html';
        } else {
            document.getElementById('loginError').innerText = 'Неверный email или пароль';
        }
    });

        // Функция регистрации
    function registerUser(name, email, password) {
        let users = JSON.parse(localStorage.getItem('users') || '[]');

        // Проверяем, не занят ли email
        if (users.find(u => u.email === email)) {
            return { success: false, error: 'Пользователь с таким email уже существует' };
        }

        // Добавляем нового пользователя
        const newUser = {
            id: Date.now(),
            fullName: name,
            email: email,
            password: password
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Автоматически входим
        const currentUser = { id: newUser.id, fullName: name, email: email };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        return { success: true };
    }

    // Обработка формы регистрации
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;

        // Валидация
        if (!name || !email || password.length < 4) {
            document.getElementById('regError').innerText = 'Заполните все поля (пароль мин. 4 символа)';
            return;
        }

        const result = registerUser(name, email, password);

        if (result.success) {
            // Успешная регистрация - переходим на главную
            window.location.href = 'index.html';
        } else {
            document.getElementById('regError').innerText = result.error;
        }
    });
