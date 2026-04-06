-- =========================================
-- Repair Crew Lab
-- Автор: студент 2 курса Андреев Владислав
-- Описание: структура БД + тестовые данные
-- =========================================

-- ---------- 1. Роли ----------
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- ---------- 2. Пользователи ----------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INT REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- 3. Кооператив ----------
CREATE TABLE cooperatives (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- 4. Членство ----------
CREATE TABLE memberships (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    cooperative_id INT REFERENCES cooperatives(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- 5. Взносы ----------
CREATE TABLE contributions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    contribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- 6. Оборудование ----------
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'available',
    description TEXT
);

-- ---------- 7. Заказы ----------
CREATE TABLE repair_orders (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INT REFERENCES users(id),
    assigned_to INT REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- ТЕСТОВЫЕ ДАННЫЕ (SEED)
-- =========================================

-- Роли
INSERT INTO roles (name) VALUES
('admin'),
('member');

-- Пользователи (пароли — заглушки-хэши)
INSERT INTO users (username, email, password_hash, role_id) VALUES
('admin', 'admin@repairlab.com', 'hashed_admin_password', 1),
('ivan', 'ivan@student.com', 'hashed_password_1', 2),
('anna', 'anna@student.com', 'hashed_password_2', 2);

-- Кооператив
INSERT INTO cooperatives (name, description) VALUES
('Repair Crew Lab', 'Студенческий ремонтный кооператив');

-- Членство
INSERT INTO memberships (user_id, cooperative_id) VALUES
(1, 1),
(2, 1),
(3, 1);

-- Взносы (стартовый капитал)
INSERT INTO contributions (user_id, amount) VALUES
(2, 5000.00),
(3, 7000.00);

-- Оборудование
INSERT INTO equipment (name, status, description) VALUES
('3D Printer', 'available', 'Прототипирование деталей'),
('CNC Machine', 'in_use', 'Станок высокой точности');

-- Заказы
INSERT INTO repair_orders (title, description, created_by, assigned_to, status) VALUES
('Ремонт ноутбука', 'Не включается', 2, 3, 'in_progress'),
('Чистка 3D принтера', 'Засор сопла', 3, 2, 'pending');
