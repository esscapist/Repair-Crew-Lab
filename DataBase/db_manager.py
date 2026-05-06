import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "repair_crew_lab.sqlite")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    if os.path.exists(DB_PATH):
        return
    conn = get_connection()
    schema_path = os.path.join(BASE_DIR, "schema.sql")
    with open(schema_path, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()

def register_student(full_name, university, card_id, phone, password_hash):
    conn = get_connection()
    try:
        cursor = conn.execute(
            'INSERT INTO students(full_name, university, student_card_id, phone, password_hash) VALUES (?, ?, ?, ?, ?)',
            (full_name, university, card_id, phone, password_hash)
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_all_loan_products():
    conn = get_connection()
    products = conn.execute('SELECT * FROM loan_products').fetchall()
    conn.close()
    return [dict(row) for row in products]

def get_student_by_phone(phone):
    conn = get_connection()
    student = conn.execute('SELECT * FROM students WHERE phone = ?', (phone,)).fetchone()
    conn.close()
    return dict(student) if student else None

def create_application(student_id, product_id, amount, purpose):
    conn = get_connection()
    cursor = conn.execute(
        'INSERT INTO loan_applications(student_id, product_id, requested_amount, purpose) VALUES (?, ?, ?, ?)',
        (student_id, product_id, amount, purpose)
    )
    conn.commit()
    app_id = cursor.lastrowid
    conn.close()
    return app_id

def get_student_applications(student_id):
    conn = get_connection()
    apps = conn.execute('SELECT * FROM loan_applications WHERE student_id = ?', (student_id,)).fetchall()
    conn.close()
    return [dict(row) for row in apps]

if __name__ == "__main__":
    init_database()
    print("База данных инициализирована.")
