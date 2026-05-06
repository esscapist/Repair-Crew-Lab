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

