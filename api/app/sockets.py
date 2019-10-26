from app import app, sio

import os
import time
import re

from mongodb import db

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
		user['online'] = True
		user['last'] = time.time()
		db['users'].save(user)


if __name__ == '__main__':
	sio.run(app, debug=False, log_output=False)


def background_thread():
	while True:
		timestamp = time.time()

		# Вышел из онлайна

		for user in db['users'].find({'last': {'$lt': timestamp - 10}}):
			user['online'] = False
			db['users'].save(user)
		
		#
		
		time.sleep(5)