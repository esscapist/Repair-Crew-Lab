from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from config import SUPPORTING_SERVICE_URL
from database import (
    get_credit_requests, get_credit_request_by_id, create_credit_request,
    update_credit_request_status, delete_credit_request, get_credit_statistics
)

app = Flask(__name__)
CORS(app)


def token_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"success": False, "message": "Токен отсутствует"}), 401

        token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header

        try:
            resp = requests.post(
                f"{SUPPORTING_SERVICE_URL}/api/verify-token",
                json={"token": token},
                timeout=5
            )
            if resp.status_code != 200 or not resp.json().get('valid'):
                return jsonify({"success": False, "message": "Недействительный токен"}), 401
            request.user_id = resp.json().get('user_id')
            request.user_email = resp.json().get('email')
        except:
            return jsonify({"success": False, "message": "Сервис авторизации недоступен"}), 503

        return f(*args, **kwargs)

    return decorated


@app.route('/')
def home():
    return jsonify({
        "service": "Core Service",
        "status": "running",
        "endpoints": [
            "GET /api/credit-requests",
            "GET /api/credit-requests/<id>",
            "POST /api/credit-requests",
            "PUT /api/credit-requests/<id>/status",
            "DELETE /api/credit-requests/<id>",
            "POST /api/calculate",
            "GET /api/statistics",
            "GET /api/about"
        ]
    })


#ПОЛУЧИТЬ ЗАЯВКИ
@app.route('/api/credit-requests', methods=['GET'])
@token_required
def api_get_credit_requests():
    """Возвращает только заявки текущего пользователя (из токена)"""
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    requests_list = get_credit_requests(
        user_email=request.user_email,
        status=status,
        page=page,
        per_page=per_page
    )

    result = []
    for req in requests_list:
        result.append({
            "id": req['id'],
            "amount": float(req['amount']),
            "term_months": req['term_months'],
            "status": req['status'],
            "created_at": str(req['created_at'])
        })

    return jsonify({
        "success": True,
        "data": result
    })


#ПОЛУЧИТЬ ЗАЯВКУ ПО ID
@app.route('/api/credit-requests/<int:request_id>', methods=['GET'])
@token_required
def api_get_credit_request(request_id):
    req = get_credit_request_by_id(request_id)
    if not req:
        return jsonify({"success": False, "message": "Заявка не найдена"}), 404

    if req['user_email'] != request.user_email:
        return jsonify({"success": False, "message": "Доступ запрещён"}), 403

    return jsonify({
        "success": True,
        "data": {
            "id": req['id'],
            "amount": float(req['amount']),
            "term_months": req['term_months'],
            "status": req['status'],
            "created_at": str(req['created_at'])
        }
    })


#СОЗДАТЬ ЗАЯВКУ
@app.route('/api/credit-requests', methods=['POST'])
@token_required
def api_create_credit_request():
    data = request.json

    amount = float(data.get('amount', 0))
    term = int(data.get('term', data.get('term_months', 12)))
    rate = float(data.get('rate', data.get('interest_rate', 10.0)))

    if amount <= 0:
        return jsonify({"success": False, "message": "amount должен быть больше 0"}), 400
    if term <= 0:
        return jsonify({"success": False, "message": "term должен быть больше 0"}), 400

    monthly_rate = (rate / 100) / 12
    if monthly_rate == 0:
        monthly_payment = amount / term
    else:
        monthly_payment = amount * (monthly_rate * (1 + monthly_rate) ** term) / ((1 + monthly_rate) ** term - 1)
    monthly_payment = round(monthly_payment, 2)

    request_id = create_credit_request(
        user_id=request.user_id,
        user_email=request.user_email,
        amount=amount,
        term_months=term,
        interest_rate=rate,
        monthly_payment=monthly_payment
    )

    req = get_credit_request_by_id(request_id)

    return jsonify({
        "success": True,
        "data": {
            "id": req['id'],
            "amount": float(req['amount']),
            "term_months": req['term_months'],
            "status": req['status'],
            "created_at": str(req['created_at'])
        }
    }), 201


#ОБНОВИТЬ СТАТУС
@app.route('/api/credit-requests/<int:request_id>/status', methods=['PUT'])
@token_required
def api_update_credit_request_status(request_id):
    data = request.json
    status = data.get('status')

    if status not in ['pending', 'approved', 'rejected']:
        return jsonify({"success": False, "message": "Некорректный статус"}), 400

    updated = update_credit_request_status(request_id, status)
    if not updated:
        return jsonify({"success": False, "message": "Заявка не найдена"}), 404

    return jsonify({
        "success": True,
        "message": f"Статус заявки изменён на {status}"
    })


#УДАЛИТЬ ЗАЯВКУ
@app.route('/api/credit-requests/<int:request_id>', methods=['DELETE'])
@token_required
def api_delete_credit_request(request_id):
    req = get_credit_request_by_id(request_id)
    if not req:
        return jsonify({"success": False, "message": "Заявка не найдена"}), 404

    if req['user_email'] != request.user_email:
        return jsonify({"success": False, "message": "Доступ запрещён"}), 403

    deleted = delete_credit_request(request_id)
    if not deleted:
        return jsonify({"success": False, "message": "Заявка не найдена"}), 404

    return jsonify({"success": True, "message": "Заявка удалена"})


#РАСЧЁТ КРЕДИТА
@app.route('/api/calculate', methods=['POST'])
@token_required
def api_calculate():
    data = request.json
    amount = float(data.get('amount', 0))
    rate = float(data.get('rate', 10.0))
    term = int(data.get('term_months', 12))

    if amount <= 0:
        return jsonify({"success": False, "message": "Сумма должна быть больше 0"}), 400

    monthly_rate = (rate / 100) / 12
    if monthly_rate == 0:
        monthly_payment = amount / term
    else:
        monthly_payment = amount * (monthly_rate * (1 + monthly_rate) ** term) / ((1 + monthly_rate) ** term - 1)

    return jsonify({
        "success": True,
        "data": {
            "amount": amount,
            "rate": rate,
            "term_months": term,
            "monthly_payment": round(monthly_payment, 2),
            "total_payment": round(monthly_payment * term, 2),
            "overpayment": round(monthly_payment * term - amount, 2)
        }
    })


#СТАТИСТИКА
@app.route('/api/statistics', methods=['GET'])
@token_required
def api_statistics():
    stats = get_credit_statistics()
    return jsonify({
        "success": True,
        "data": stats
    })

if __name__ == '__main__':
    print("=" * 50)
    print("CORE SERVICE (Flask) запущен на http://0.0.0.0:5000")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)
