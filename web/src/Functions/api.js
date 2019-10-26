import axios from 'axios';
import openSocket from 'socket.io-client';

function serverRequest(json = {}) {
    return axios.post('https://tensyteam.ru/api/', json);
}

function handlerResult(that, res, handlerSuccess, handlerError) {
    if (res.error) {
        handlerError(that, res);
    } else {
        handlerSuccess(that, res);
    }
}

export default function api(that, method, params = {}, handlerSuccess = () => {},
    handlerError = () => {}) {
    const json = {
        method,
        params,
    };

    json.token = JSON.parse(localStorage.getItem('token'));
    // console.log(json);
    serverRequest(json).then((res) => handlerResult(that, res.data, handlerSuccess, handlerError));
}

// online
export const socketIo = openSocket('https://tensyteam.ru/main');
