from flask import Flask, request, jsonify

app = Flask(__name__)

# Роуты для построек
@app.route('/buildings', methods=['GET'])
def get_buildings():
    return {"message": "Список построек ", "buildings": []}

@app.route('/buildings/<int:building_id>', methods=['GET'])
def get_building(building_id):
    return {"message": f"Постройка {building_id} "}

@app.route('/buildings', methods=['POST'])
def create_building():
    return {"message": "Постройка создана", "data": request.json}

# Роуты для кредитных заявок
@app.route('/applications', methods=['GET'])
def get_applications():
    return {"message": "Список заявок", "applications": []}

@app.route('/applications/<int:app_id>', methods=['GET'])
def get_application(app_id):
    return {"message": f"Заявка {app_id} "}

@app.route('/applications', methods=['POST'])
def create_application():
    return {"message": "Заявка создана", "data": request.json}


@app.route('/applications/<int:app_id>/status', methods=['PUT'])
def update_status(app_id):
    return {"message": f"Статус заявки {app_id} изменён", "status": request.json.get('status')}

# Роут для расчёта кредита
@app.route('/calculate', methods=['POST'])
def calculate_credit():
    data = request.json
    return {
        "message": "Расчёт кредита",
        "amount": data.get('amount'),
        "rate": data.get('rate'),
        "term": data.get('term')
    }

if __name__ == '__main__':
    app.run(debug=True)
