from flask import request, jsonify
from app import app, sio


@app.route('/', methods=['POST', 'OPTIONS'])
def index():
	x = request.json

	#  Не указан метод API

	if 'method' not in x:
		return jsonify({'error': 2, 'result': 'Wrong method'})

	# #  Не указаны параметры API

	# if 'params' not in x:
	# 	return jsonify({'error': 3, 'message': 'Wrong params'})

	#

	return jsonify(x)