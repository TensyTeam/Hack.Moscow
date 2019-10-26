from app import app, sio

import os
import time
import re

from mongodb import db
from api._func import get_preview

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