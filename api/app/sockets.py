from app import app, sio

import os
import time
import re

from mongodb import db
from api._func import get_preview, next_id

# Socket.IO

from threading import Lock
from flask_socketio import emit

thread = None
thread_lock = Lock()


# Онлайн пользователи

@sio.on('online', namespace='/main')
def online(x):
	global thread
	with thread_lock:
		if thread is None:
			thread = sio.start_background_task(target=background_thread)

	user = db['users'].find_one({'token': x['token']})

	if user:
		# Добавление онлайн заданий

		if not user['online']:
			db_condition = {
				'id': {'$in': user['tasks']},
			}

			tasks = [i for i in db['tasks'].find(db_condition, {'_id': False}) if i]

			for i in range(len(tasks)):
				tasks[i]['image'] = get_preview('tasks', tasks[i]['id'])

			sio.emit('tasks_add', tasks, namespace='/main')

		#

		user['online'] = True
		user['last'] = time.time()
		db['users'].save(user)

# Сообщения

@sio.on('message_send', namespace='/main')
def message(mes):
	space = db['space'].find_one({'id': mes['space']})

	timestamp = time.time()

	message_id = next_id('space')

	space['messages'].append({
		'id': message_id,
		'user': mes['token'],
		'cont': mes['cont'],
		'time': timestamp,
	})
	db['space'].save(space)

	# Отправить сообщение

	sio.emit('message_get', {
		'space': mes['space'],
		'id': message_id,
		'user': mes['token'],
		'cont': mes['cont'],
		'time': timestamp,
	}, namespace='/main')

# Видеочат

@sio.on('candidate1', namespace='/main')
def candidate1(mes):
	sio.emit('candidate1', mes, namespace='/main')

@sio.on('description1', namespace='/main')
def description1(mes):
	sio.emit('description1', mes, namespace='/main')

@sio.on('candidate2', namespace='/main')
def candidate2(mes):
	sio.emit('candidate2', mes, namespace='/main')

@sio.on('description2', namespace='/main')
def description2(mes):
	sio.emit('description2', mes, namespace='/main')


if __name__ == '__main__':
	sio.run(app)

	# with thread_lock:
	# 	if thread is None:
	# 		thread = sio.start_background_task(target=background_thread)


def background_thread():
	while True:
		timestamp = time.time()

		# Вышел из онлайна

		db_condition = {
			'last': {'$lt': timestamp - 10},
			'online': True,
		}

		for user in db['users'].find(db_condition):
			user['online'] = False
			db['users'].save(user)

			# Удаление онлайн заданий

			db_condition = {
				'id': {'$in': user['tasks']},
			}

			db_filter = {
				'_id': False,
				'id': True,
			}

			tasks = [i for i in db['tasks'].find(db_condition, db_filter) if i]

			sio.emit('tasks_del', tasks, namespace='/main')

		#

		time.sleep(5)