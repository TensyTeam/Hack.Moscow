import React from 'react';
import { Link } from 'react-router-dom';

import { socketIo } from '../Functions/api';
import { dateFormat } from '../Functions/handle';


class Space extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			path: {
				room: Number(document.location.pathname.split('/')[2]),
				type: document.location.search.split('=')[1],
			},
			position: document.location.search.split('=')[1],
			arrayMessages: [],
		};
		this.onReload = this.onReload.bind(this);
		this.onSendMessage = this.onSendMessage.bind(this);
		this.handleKeyPress = this.handleKeyPress.bind(this);

		const stun = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
		this.peer = new RTCPeerConnection(stun);

		this.yourDescription = null;
		this.otherDescription = null;
		this.yourCandidate = null;
		this.newCandidate = null;

		this.answer = this.answer.bind(this);
		this.call = this.call.bind(this);
		this.connect = this.connect.bind(this);

		this.candidate1 = null;
		this.description1 = null;
		this.candidate2 = null;
		this.description2 = null;
		this.sended = 0;
		this.stream = null;
	}

	componentWillMount() {
		// ожидание входящего сообщения
		socketIo.on('message_get', (mes) => {
			console.log(mes);
			const { path } = this.state;
			if (mes.space === path.room) {
				const { arrayMessages } = this.state;
				arrayMessages.push(mes);
				this.setState({ arrayMessages });
			}
		});
		this.onReload();
	}

	onSendMessage() {
		const { path } = this.state;
        const message = document.getElementById('message_field').value;
        if (message.length !== 0) {
            document.getElementById('message_field').style.background = '#cccccc50';
            document.getElementById('message_field').value = '';
            // отправка исходящего сообщения
            socketIo.emit('message_send', {
				token: JSON.parse(localStorage.getItem('token')),
                space: path.room,
                cont: message,
            });
        } else {
            document.getElementById('message_field').style.background = '#e74c3c4a';
        }
	}

	onReload() {
		const { position } = this.state;
		console.log(position);

		// student
		if (position === 'student') {
			this.peer.onicecandidate = (e) => {
				if (e.candidate) {
					this.yourCandidate = e.candidate;
					if (this.yourCandidate) {
						this.sended++;
						console.log(this.sended, this.yourCandidate);
						console.log('!', this.sended);
						socketIo.emit('candidate2', { yourCandidate: this.yourCandidate, room: document.location.pathname.split('/')[2] });
					}
				}
			};

			socketIo.on('candidate1', (mes) => {
				if (mes.room === document.location.pathname.split('/')[2]) {
					console.log('!cand1', mes.yourCandidate);
					this.peer.addIceCandidate(mes.yourCandidate);
				}
			});

			socketIo.on('description1', (mes) => {
				if (mes.room === document.location.pathname.split('/')[2]) {
					console.log('!desc1', mes.yourDescription);
					this.description1 = mes.yourDescription;
					this.answer();
				}
			});
		} else if (position === 'teacher') {
			this.peer.onicecandidate = (e) => {
				if (e.candidate) {
					this.yourCandidate = e.candidate;
					if (this.yourCandidate) {
						this.sended++;
						console.log(this.sended, this.yourCandidate);

						console.log('!', this.sended);
						socketIo.emit('candidate1', { yourCandidate: this.yourCandidate, room: document.location.pathname.split('/')[2] });
					}
				}
			}

			this.call();
			this.call();

			socketIo.on('candidate2', (mes) => {
				if (mes.room === document.location.pathname.split('/')[2]) {
					console.log('!cand2', mes.yourCandidate);
					this.peer.addIceCandidate(mes.yourCandidate);
				}
			});

			socketIo.on('description2', (mes) => {
				if (mes.room === document.location.pathname.split('/')[2]) {
					console.log('!desc2', mes.yourDescription);
					this.description2 = mes.yourDescription;
					this.connect();
				}
			});
		}
	}

	call() {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true })
		.then((stream) => {
			const videoLocal = document.getElementById('local');
			videoLocal.autoplay = true;
			videoLocal.muted = true;
			videoLocal.srcObject = stream;
			this.stream = stream;
			// iOS
			let peer = this.peer;
			stream.getTracks().forEach((track) => {
				peer.addTrack(track, stream);
			});

			return this.peer.createOffer();
		})
		.then((offer) => {
			// Mozilla
			this.peer.setLocalDescription(new RTCSessionDescription(offer)).then(
				() => {
					this.yourDescription = this.peer.localDescription;
					if (this.yourDescription) {
						socketIo.emit('description1', { yourDescription: this.yourDescription, room: document.location.pathname.split('/')[2] });
					}
				},
			);
		});

		this.peer.ontrack = (e) => {
			document.getElementById('remote').srcObject = e.streams[0];
		};
	}

	connect() {
		this.peer.setRemoteDescription(this.description2);
	}

	answer() {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true })
		.then((stream) => {
			const videoLocal = document.getElementById('local');
			videoLocal.autoplay = true;
			videoLocal.muted = true;
			videoLocal.srcObject = stream;
			this.stream = stream;
			// iOS
			let peer = this.peer;
			stream.getTracks().forEach((track) => {
				peer.addTrack(track, stream);
			});

			this.peer.setRemoteDescription(this.description1);
		})
		.then(() => this.peer.createAnswer())
		.then((answer) => {
			// Mozilla
			this.peer.setLocalDescription(new RTCSessionDescription(answer)).then(() => {
				this.yourDescription = this.peer.localDescription;
				if (this.yourDescription) {
					socketIo.emit('description2', { yourDescription: this.yourDescription, room: document.location.pathname.split('/')[2] });
				}
			});
		});

		this.peer.ontrack = (e) => {
			document.getElementById('remote').srcObject = e.streams[0];
		};
	}

	handleKeyPress(event) {
		if (event.key === 'Enter') {
			this.onSendMessage();
		}
	}

	render() {
		const {
			arrayMessages,
		} = this.state;
		console.log(arrayMessages);
		return (
			<div id="space">
				<div className="videochat_block" id="videochat">
					<Link id="video_control" to="/">
						<span>Go back</span>
					</Link>
					<div id="videos">
						<video id="local" autoPlay controls />
						<video id="remote" autoPlay controls />
					</div>
				</div>
				<div className="chat_block" id="chat">
					<div className="chat_content">
						{arrayMessages.length !== 0 && arrayMessages.map((message) => (
							<div key={message.time}>
								{message.user === JSON.parse(localStorage.getItem('token')) ? (
									<div className="my_message">
										<div className="message_content">
											{message.cont}
										</div>
										<span className="message_date">{dateFormat(message.time * 1000)}</span>
									</div>
								) : (
									<div className="other_message">
										<div className="message_content">
											{message.cont}
										</div>
										<span className="message_date">{dateFormat(message.time * 1000)}</span>
									</div>
								)}
							</div>
						))}
					</div>
					<div className="chat_bottom">
						<input type="text" id="message_field" onKeyPress={(event) => { this.handleKeyPress(event); }} />
						<div className="btn" onClick={() => { this.onSendMessage(); }}>Send</div>
					</div>
				</div>
			</div>
		);
	}
}

export default Space;
