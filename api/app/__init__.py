from flask import Flask

from sets import SERVER

#

app = Flask(__name__)

# Socket.IO

from flask_socketio import SocketIO
sio = SocketIO(app, async_mode=None)

#


from app import api
from app import sockets