import os
import time
import re

from mongodb import db
from api._error import ErrorWrong, ErrorAccess
from api._func import next_id, check_params


# Начать обучение

def start(this, **x):
	# Проверка параметров

	check_params(x, (
		('id', True, int),
	))

	# Не авторизован

	if this.user['admin'] < 3:
		raise ErrorAccess('token')

	#

	db_filter = {
		'_id': False,
		'user': True,
	}
	task = db['tasks'].find_one({'id': x['id']}, db_filter)

	# Неправильное задание

	if not task:
		raise ErrorWrong('task')

	#

	space_id = next_id('space')

	space = {
		'id': space_id,
		'teacher': this.user['token'],
		'student': task['user'],
		'task': x['id'],
		# 'price': price,
		'time': this.timestamp,
		'status': 0,
		'messages': [],
	}

	#

	db['space'].insert_one(space)

	# Запрос ученику

	this.socketio.emit('student_accept', {
		'id': space_id,
		'user': task['user'],
	}, namespace='/main')

	# Удалить онлайн задания

	user = db['users'].find_one({'token': task['user']}, {'_id': False, 'tasks': True})

	db_condition = {
		'id': {'$in': this.user['tasks'] + user['tasks']},
	}

	db_filter = {
		'_id': False,
		'id': True,
	}

	tasks = [i for i in db['tasks'].find(db_condition, db_filter) if i]

	this.socketio.emit('tasks_del', tasks, namespace='/main')

	# Ответ

	res = {
		'id': space_id,
	}

	return res

# Полученить пространство обучения

def get(this, **x):
	# Проверка параметров

	check_params(x, (
		('id', True, int),
	))

	# Нет доступа

	if this.user['admin'] < 3:
		raise ErrorAccess('token')

	#

	db_filter = {
		'_id': False,
	}

	space = db['space'].find_one({'id': x['id']}, db_filter)

	if not space:
		raise ErrorWrong('id')

	# Ответ

	res = {
		'space': space,
	}

	return res
