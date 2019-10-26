import React from 'react';

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
			arrayStudy: [],
		};
		this.onReload = this.onReload.bind(this);
		this.onSendMessage = this.onSendMessage.bind(this);

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
			const { path } = this.state;
			if (mes.space === path.room) {
				const { arrayStudy } = this.state;
				arrayStudy.space.messages.push(mes);
				this.setState({ arrayStudy });
				const chat = document.getElementById('chat');
				chat.scrollTop = chat.scrollHeight;
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
						socketIo.emit('candidate2', this.yourCandidate);
					}
				}
			};

			socketIo.on('candidate1', (mes) => {
				console.log('!cand1', mes);
				this.peer.addIceCandidate(mes);
			});

			socketIo.on('description1', (mes) => {
				console.log('!desc1', mes);
				this.description1 = mes;
				this.answer();
			});
		} else if (position === 'teacher') {
			this.peer.onicecandidate = (e) => {
				if (e.candidate) {
					this.yourCandidate = e.candidate;
					if (this.yourCandidate) {
						this.sended++;
						console.log(this.sended, this.yourCandidate);

						console.log('!', this.sended);
						socketIo.emit('candidate1', this.yourCandidate);
					}
				}
			}

			this.call();
			this.call();

			socketIo.on('candidate2', (mes) => {
				console.log('!cand2', mes);
				this.peer.addIceCandidate(mes);
			});

			socketIo.on('description2', (mes) => {
				console.log('!desc2', mes);
				this.description2 = mes;
				this.connect();
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
						socketIo.emit('description1', this.yourDescription);
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
		document.getElementById('connect').classList.remove('fa-error');
		document.getElementById('connect').classList.add('fa-success');
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
					socketIo.emit('description2', this.yourDescription);
				}
			});
		});

		this.peer.ontrack = (e) => {
			document.getElementById('remote').srcObject = e.streams[0];
		};
	}

	render() {
		const {
			position, arrayStudy,
		} = this.state;
		const { user } = this.props;
		return (
			<div id="space">
				<div className="chat_block" id="chat">
					<div className="chat_header_block">
						<div className="chat_header_scroll">
							{(position === 'student' || position === 'bot') && (
								<div className="chat_control chat_control_red" onClick={() => { this.onLocalPopup(true, 'assessment'); }}>
									<div className="icon">
											Finish
									</div>
								</div>
							)}
						</div>
					</div>
					<div className="chat_content">
						{arrayStudy.length !== 0 && arrayStudy.space.messages.map((message) => (
							<div key={message.time}>
								{message.user === user.id ? (
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
						<input type="text" id="message_field" />
						<div className="btn" onClick={() => { this.onSendMessage(); }}>Send</div>
					</div>
				</div>
				<div className="videochat_block" id="videochat">
					<div id="videos">
						<video id="local" autoPlay controls />
						<video id="remote" autoPlay controls />
					</div>
				</div>
			</div>
		);
	}
}

export default Space;
