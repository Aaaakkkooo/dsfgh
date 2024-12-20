let items = [];
let favorites = [];
let isLoggedIn = false; // Состояние авторизации

const translations = {
    ru: {
        addTitle: "Добавление товара",
        name: "Название",
        description: "Описание",
        phone: "Номер телефона",
        owner: "Имя",
        category: "Выберите категорию",
        type: "Тип товара",
        addItem: "Добавить товар",
        itemList: "Список товаров",
        allCategories: "Все категории",
        allTypes: "Все типы",
        newest: "Сначала новые",
        oldest: "Сначала старые",
        search: "Поиск по ключевой букве",
        showAll: "Показать все",
        loginPrompt: "Пожалуйста, войдите в систему, чтобы добавить товар."
    },
    kk: {
        addTitle: "Тауар қосу",
        name: "Атауы",
        description: "Сипаттама",
        phone: "Телефон нөмірі",
        owner: "Есімі",
        category: "Санатты таңдаңыз",
        type: "Тауар түрі",
        addItem: "Тауарды қосу",
        itemList: "Тауарлар тізімі",
        allCategories: "Барлық санаттар",
        allTypes: "Барлық түрлері",
        newest: "Алдымен жаңалары",
        oldest: "Алдымен ескілері",
        search: "Кілт сөзі бойынша іздеу",
        showAll: "Барлығын көрсету",
        loginPrompt: "Тауар қосу үшін жүйеге кіріңіз."
    },
};


// Инициализация базы данных IndexedDB
function initializeDatabase() {
    const request = indexedDB.open("ExchangeApp", 1);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains("items")) {
            db.createObjectStore("items", { keyPath: "id", autoIncrement: true });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        console.log("База данных готова.");
        fetchItemsFromDatabase(renderItems);
    };

    request.onerror = (event) => {
        console.error("Ошибка базы данных:", event.target.errorCode);
    };
}

function saveItemToDatabase(item) {
    const transaction = db.transaction(["items"], "readwrite");
    const store = transaction.objectStore("items");
    store.add(item);

    transaction.oncomplete = () => {
        console.log("Товар сохранен в базу данных.");
    };

    transaction.onerror = (event) => {
        console.error("Ошибка сохранения:", event.target.errorCode);
    };
}

function fetchItemsFromDatabase(callback) {
    const transaction = db.transaction(["items"], "readonly");
    const store = transaction.objectStore("items");
    const items = [];

    store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            items.push(cursor.value);
            cursor.continue();
        } else {
            callback(items);
        }
    };
}

// Google OAuth2
function initializeGoogleLogin() {
    google.accounts.id.initialize({
        client_id: 'ВАШ_CLIENT_ID.apps.googleusercontent.com',
        callback: handleGoogleLogin
    });
    google.accounts.id.renderButton(
        document.getElementById("googleLogin"), 
        { theme: "outline", size: "large" }
    );
}

function handleGoogleLogin(response) {
    const userData = jwt_decode(response.credential);
    loginUserWithGoogle(userData);
}

function loginUserWithGoogle(userData) {
    isLoggedIn = true;
    showNotification(`Добро пожаловать, ${userData.name || userData.email}!`);
    console.log("Пользователь Google:", userData); // Для отладки
}

// ВКонтакте OAuth
function initializeVKLogin() {
    VK.init({ apiId: ВАШ_API_ID });

    document.getElementById('vkLogin').addEventListener('click', () => {
        VK.Auth.login((response) => {
            if (response.session) {
                const userData = response.session.user;
                loginUserWithVK(userData);
            } else {
                showNotification("Ошибка авторизации ВКонтакте.");
            }
        });
    });
}

function loginUserWithVK(userData) {
    isLoggedIn = true;
    showNotification(`Добро пожаловать, ${userData.first_name} ${userData.last_name}!`);
    console.log("Пользователь ВКонтакте:", userData); // Для отладки
}


let currentLang = "ru";

function translateInterface() {
    const texts = translations[currentLang];
    document.getElementById("addTitle").textContent = texts.addTitle;
    document.getElementById("name").placeholder = texts.name;
    document.getElementById("description").placeholder = texts.description;
    document.getElementById("phone").placeholder = texts.phone;
    document.getElementById("owner").placeholder = texts.owner;
    document.getElementById("category").options[0].textContent = texts.category;
    document.getElementById("type").options[0].textContent = texts.type;
    document.querySelector("button[type='submit']").textContent = texts.addItem;
    document.getElementById("itemListTitle").textContent = texts.itemList;
    document.getElementById("search").placeholder = texts.search;
    document.querySelector("button[onclick='showAllItems()']").textContent = texts.showAll;
}

function showLoginModal() {
    // Создаем оверлей
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    // Создаем окно авторизации
    const modal = document.createElement('div');
    modal.className = 'login-modal';
    modal.innerHTML = `
        <p>Пожалуйста, войдите в систему, чтобы продолжить</p>
        <button class="btn btn-primary" id="actionButton">Перейти к регистрации</button>
    `;

    // Добавляем кнопку, которая будет выполнять две функции
    const actionButton = modal.querySelector('#actionButton');
    actionButton.classList.add('btn', 'btn-primary');
    actionButton.addEventListener('click', () => {
        document.body.removeChild(overlay); // Закрытие модального окна
        redirectToRegister(); // Перенаправление на страницу регистрации
    });

    // Добавляем кнопку закрытия модального окна
    const closeButton = document.createElement('button');
    
   
    closeButton.addEventListener('click', () => {
        document.body.removeChild(overlay); // Закрытие модального окна
    });

    modal.appendChild(closeButton);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Закрытие модального окна при клике на оверлей
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}

// Функция перенаправления на страницу регистрации
function redirectToRegister() {
    window.location.href = '/register'; // Измените путь на свой
}


function redirectToRegister() {
    // Найти вкладку "Личный кабинет"
    const accountTab = document.querySelector('#account-tab');
    const accountSection = document.querySelector('#account');

    // Активировать вкладку и переключиться на её содержимое
    const tabInstance = new bootstrap.Tab(accountTab);
    tabInstance.show();

    // Прокрутить страницу к личному кабинету, если необходимо
    accountSection.scrollIntoView({ behavior: 'smooth' });
}


function checkAuthorization(event) {
    if (!isLoggedIn) {
        event.preventDefault();
        showLoginModal();
        return false;
    }
    return true;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 500);
}

function addItem(event) {
    if (!checkAuthorization(event)) return;

    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const phone = document.getElementById('phone').value;
    const owner = document.getElementById('owner').value;
    const category = document.getElementById('category').value;
    const type = document.getElementById('type').value;
    const dateAdded = new Date();
    const image = document.getElementById('image').files[0];

    const reader = new FileReader();
    reader.onload = function(e) {
        items.push({ name, description, phone, owner, category, type, dateAdded, image: e.target.result });
        document.getElementById('addForm').reset();
        showNotification('Товар добавлен!');
        renderItems();
    };
    reader.readAsDataURL(image);
}

function renderItems(filteredItems = items) {
    const container = document.getElementById('itemsContainer');
    container.innerHTML = '';
    filteredItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="item-content">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <p>${item.phone}</p>
                <p>${item.owner}</p>
                <p>${item.category}</p>
                <p>${item.type}</p>
                <p>${item.dateAdded.toLocaleDateString()}</p>
                <button class="btn btn-outline-danger favorite-btn" onclick="toggleFavorite('${item.name}')">❤️ В избранное</button>
            </div>
        `;
        container.appendChild(itemElement);
    });
}

function toggleFavorite(itemName) {
    const item = items.find(i => i.name === itemName);
    if (!item) return;

    if (favorites.some(fav => fav.name === itemName)) {
        favorites = favorites.filter(fav => fav.name !== itemName);
        showNotification(`Удалено из избранного: ${itemName}`);
    } else {
        favorites.push(item);
        showNotification(`Добавлено в избранное: ${itemName}`);
    }
    updateFavorites();
}

function updateFavorites() {
    const favoritesContainer = document.getElementById('favoritesContainer');
    favoritesContainer.innerHTML = '';
    favorites.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="item-content">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <p>${item.phone}</p>
                <p>${item.owner}</p>
                <p>${item.category}</p>
                <p>${item.type}</p>
                <button class="btn btn-outline-danger favorite-btn" onclick="toggleFavorite('${item.name}')">❤️ В избранное</button>
            </div>
        `;
        favoritesContainer.appendChild(itemElement);
    });
}


function toggleLanguage() {
    currentLang = currentLang === "ru" ? "kk" : "ru";
    translateInterface();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
}

function loginUser() {
    isLoggedIn = true;
    showNotification('Вы успешно вошли в систему!');
}

function logoutUser() {
    isLoggedIn = false;
    showNotification('Вы вышли из системы.');
}

window.onload = () => {
    translateInterface();
    renderItems();
};


