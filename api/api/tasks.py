import time

from mongodb import db
from api._error import ErrorWrong, ErrorUpload, ErrorAccess, ErrorInvalid
from api._func import check_params, next_id, get_preview


# Создание / редактирование

def edit(this, **x):
	# Проверка параметров

	# Редактирование
	if 'id' in x:
		check_params(x, (
			('id', True, int),
			('image', False, str, True),
			('text', False, str, True),
			('tags', False, list, str, True),
		))

	# Добавление
	else:
		check_params(x, (
			('image', False, str, True),
			('file', False, str, True),
			('text', False, str, True),
			('tags', False, list, str, True),
		))

	# Не авторизован

	if this.user['admin'] < 5:
		raise ErrorAccess('add / edit')

	# Редактирование
	if 'id' in x:
		query = db['tasks'].find_one({'id': x['id']})

		# Неправильный id
		if not query:
			raise ErrorWrong('tasks')

		# Чужое задание
		if query['token'] != this.user['token']:
			raise ErrorAccess('token')

	# Создание
	else:
		# Нет содержимого

		cond_text = 'text' not in x or not x['text']
		cond_img = 'image' not in x or not x['image']

		if cond_text and cond_img:
			raise ErrorInvalid('image / text')

		#

		query = {
			'id': next_id('tasks'),
			'time': this.timestamp,
			'text': x['text'] if 'text' in x else '',
			'tags': x['tags'] if 'tags' in x else [],
			'user': this.user['token'],
		}

	# Загрузка картинки

	if 'image' in x:
		try:
			file_type = x['file'].split('.')[-1]
		
		# Неправильное расширение
		except:
			raise ErrorInvalid('file')

		try:
			load_image('app/static/tasks', x['image'], query['id'], file_type)

		# Ошибка загрузки изображения
		except:
			raise ErrorUpload('image')

	# Поля

	for par in ('text', 'tags'):
		if par in x:
			query[par] = x[par]

	db['ladders'].save(query)
	
	# Ответ

	res = {
		'id': query['id'],
	}

	return res

# Получение

def get(this, **x):
	# Проверка параметров

	check_params(x, (
		('id', False, (int, list, tuple), int),
		('my', False, bool),
		('count', False, int),
	))

	# Мои задания

	if 'my' not in x:
		x['my'] = False

	# Условия

	count = x['count'] if 'count' in x else None

	db_condition = dict()

	if 'id' in x:
		if type(x['id']) == int:
			db_condition['id'] = x['id']

		else:
			db_condition['id'] = {'$in': x['id']}

	else:
		if x['my']:
			db_condition['id'] = {'$in': this.user['tasks']}

	#

	db_filter = {
		'_id': False,
		'token': False,
	}

	tasks = [i for i in db['tasks'].find(db_condition, db_filter) if i]

	# Количество

	tasks = tasks[:count]

	# Изображение

	for i in range(len(tasks)):
		tasks[i]['image'] = get_preview('tasks', tasks[i]['id'])
	
	# Ответ

	res = {
		'tasks': tasks,
	}

	return res

# Удаление

def delete(this, **x):
	# Проверка параметров

	check_params(x, (
		('id', True, int),
	))

	#

	task = db['tasks'].find_one({'id': x['id']})

	if this.user['admin'] < 3 or task['token'] != this.user['token']:
		raise ErrorAccess('token')

	db['tasks'].delete_one(task)