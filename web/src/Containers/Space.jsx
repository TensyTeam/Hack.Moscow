import React from 'react';
import { withRouter } from 'react-router-dom';
import ReactHtmlParser from 'react-html-parser';
import { withTranslation } from 'react-i18next';

import { socketIo } from '../../func/socket';
import { getStudy, stopStudy } from '../../func/methods';
import { dateFormat } from '../../func/handle';


class Space extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			path: {
				ladderId: document.location.search.length > 5 ? Number(document.location.search.split('&')[0].split('=')[1]) : '',
				stepId: document.location.search.length > 5 ? Number(document.location.pathname.split('/').pop()) : '',
				room: Number(document.location.pathname.split('/')[2]),
				type: document.location.search.length > 5 ? document.location.search.split('&')[1].split('=')[1] : '',
			},
			arrayStudy: [],
			currentSpacePanel: 'chat',
			position: document.location.search.split('=')[2],
			localPopup: { active: false, current: null },
		};
		this.onReload = this.onReload.bind(this);
		this.onLocalPopup = this.onLocalPopup.bind(this);
		this.onChangeSpacePanel = this.onChangeSpacePanel.bind(this);
		this.onSendMessage = this.onSendMessage.bind(this);
		this.onStopStudy = this.onStopStudy.bind(this);
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
		const { position } = this.state;
		const { user, onRedirect, history } = this.props;
		// проверка авторизации
		if (user.id === undefined || (user.id !== undefined && user.id === 0)) {
			onRedirect('/ladders');
		}
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
		// ожидание старта второго видеочата
		socketIo.on('video_start', (mes) => {
			const { path } = this.state;
			if (mes.space === path.room) {
				const { currentSpacePanel } = this.state;
				if (currentSpacePanel === 'chat' && mes.space === path.room) {
					this.setState({ currentSpacePanel: 'videochat' });
					this.onReload();
				}
			}
		});
		// ожидание завершения второго видеочата
		socketIo.on('video_stop', (mes) => {
			const { path } = this.state;
			if (mes.space === path.room) {
				const { currentSpacePanel } = this.state;
				if (currentSpacePanel === 'videochat' && mes.space === path.room) {
					this.setState({ currentSpacePanel: 'chat' });
					window.location.href = window.location.href;
				}
			}
		});
		// ожидание учителем окончания обучения
		socketIo.on('teacher_stop', (mes) => {
			const { path } = this.state;
			if (mes.space === path.room) {
				window.location.href = localStorage.getItem('previousPath');
			}
		});

		const { path } = this.state;
		getStudy(this, { id: path.room }).then((_eventGetStudy) => {
			console.log(_eventGetStudy);
			if (_eventGetStudy.error === 9) {
				history.goBack();
			}
			if (_eventGetStudy.space) {
				this.setState({ arrayStudy: _eventGetStudy });
				if (_eventGetStudy.space.status === 1) {
					if (position === 'student') {
						socketIo.emit('video_start', {
							space: path.room,
						});
					}
					this.setState({ currentSpacePanel: 'videochat' });
					this.onReload();
				}
			}
		});
	}

	onStopStudy(_status) {
		const { path } = this.state;
		stopStudy(this, { id: path.room, status: _status }).then((_eventStopStudy) => {
			// console.log(_eventStopStudy);
			if (_eventStopStudy.error === 0) {
				window.location.href = `/step/${path.stepId}?ladder=${path.ladderId}`;
			}
		});
	}

	onChangeSpacePanel(_panel) {
		const { path } = this.state;
		if (_panel === 'videochat') {
			this.setState({ currentSpacePanel: _panel });

			// отправка старта видеочата
			socketIo.emit('video_start', {
                space: path.room,
            });
			this.onReload();
		}
		if (_panel === 'chat') {
			// отправка завершения видеочата
			socketIo.emit('video_stop', {
                space: path.room,
            });
			window.location.href = window.location.href;
		}
	}

	onLocalPopup(_active, _current) {
		this.setState({ localPopup: { active: _active, current: _current } });
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

	handleKeyPress(event) {
		if (event.key === 'Enter') {
			this.onSendMessage();
		}
	}

	render() {
		const {
			position, currentSpacePanel, arrayStudy, localPopup,
		} = this.state;
		const { user, t, history } = this.props;
		return (
			<div id="space">
				{localPopup.active && (
					<>
						{localPopup.current === 'assessment' && (
							<div className="popup">
								<div className="popup_close_panel" onClick={() => { this.onLocalPopup(false); }} />
								<div className="popup_content popup_assessment">
									<div className="title">{ t('space.finishTitle') }</div>
									<div className="popup_close" onClick={() => { this.onLocalPopup(false); }}><i className="fas fa-times" /></div>
									<div className="popup_blocks">
										<div className="popup_block" onClick={() => { this.onStopStudy(true); }}>
											<i className="far fa-smile" />
											{ t('space.finishSuccess') }
										</div>
										<div className="popup_block" onClick={() => { this.onStopStudy(false); }}>
											<i className="far fa-frown" />
											{ t('space.finishConflict') }
										</div>
									</div>
								</div>
							</div>
						)}
						{localPopup.current === 'theory' && (
							<div className="popup">
								<div className="popup_close_panel" onClick={() => { this.onLocalPopup(false); }} />
								<div className="popup_content">
									<div className="title">{ t('structure.theory') }</div>
									<div className="popup_close" onClick={() => { this.onLocalPopup(false); }}><i className="fas fa-times" /></div>
									<div className="popup_text">{ReactHtmlParser(arrayStudy.step.theory)}</div>
								</div>
							</div>
						)}
						{localPopup.current === 'task' && (
							<div className="popup">
								<div className="popup_close_panel" onClick={() => { this.onLocalPopup(false); }} />
								<div className="popup_content">
									<div className="title">{arrayStudy.step.name}</div>
									<div className="popup_close" onClick={() => { this.onLocalPopup(false); }}><i className="fas fa-times" /></div>
									<div className="popup_text">{ReactHtmlParser(arrayStudy.step.cont)}</div>
								</div>
							</div>
						)}
					</>
				)}
				{currentSpacePanel === 'chat' && (
					<div className="chat_block" id="chat">
						<div className="chat_header_block">
							<div className="chat_header_scroll">
								{arrayStudy.length !== 0 && arrayStudy.space.status !== 4 ? (
									<>
										{(position === 'student' || position === 'bot') && (
											<div className="chat_control chat_control_red" onClick={() => { this.onLocalPopup(true, 'assessment'); }}>
												<div className="icon">
													{ t('structure.finish') }
												</div>
											</div>
										)}
									</>
								) : (
									<div className="chat_control chat_control_red" onClick={() => { history.goBack(); }}>
										<div className="icon">
											{ t('structure.back') }
										</div>
									</div>
								)}
								<div className="chat_control" onClick={() => { this.onLocalPopup(true, 'task'); }}>
									<div className="icon">
										{ t('structure.task') }
									</div>
								</div>
								{arrayStudy.length !== 0 && arrayStudy.step.theory !== undefined && (
									<div className="chat_control" onClick={() => { this.onLocalPopup(true, 'theory'); }}>
										<div className="icon">
											{ t('structure.theory') }
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
												{position === 'bot' ? (
													ReactHtmlParser(message.cont)
												) : (
													message.cont
												)}
											</div>
											<span className="message_date">{dateFormat(message.time * 1000)}</span>
										</div>
									)}
								</div>
							))}
						</div>
						<div className="chat_bottom">
							{arrayStudy.length !== 0 && arrayStudy.space.status !== 4 ? (
								<>
									{position !== 'bot' && (
										<div className="circle_btn" onClick={() => { this.onChangeSpacePanel('videochat'); }}>
											<i id="create-circle" className="fas fa-video" />
										</div>
									)}
									<input type="text" id="message_field" style={position === 'bot' ? { marginLeft: '20px' } : {}} onKeyPress={(event) => { this.handleKeyPress(event); }} autoFocus autoComplete="off" />
									<div className="btn" onClick={() => { this.onSendMessage(); }}>
										{ t('structure.send') }
									</div>
								</>
							) : (
								<div className="subtitle">{ t('structure.finishStudy') }</div>
							)}
						</div>
					</div>
				)}
				{currentSpacePanel === 'videochat' && (
					<div className="videochat_block" id="videochat">
						<div className="chat_header_block">
							<div className="chat_header_scroll">
								<div className="chat_control_group">
									{position === 'student' && (
										<div className="chat_control chat_control_red" onClick={() => { this.onLocalPopup(true, 'assessment'); }}>
											<div className="icon">
												{ t('structure.finish') }
											</div>
										</div>
									)}
									<div className="chat_control" onClick={() => { this.onChangeSpacePanel('chat'); }}>
										<div className="icon">
											{ t('structure.toСhat') }
										</div>
									</div>
									<div className="chat_control" onClick={() => { this.onLocalPopup(true, 'task'); }}>
										<div className="icon">
											{ t('structure.task') }
										</div>
									</div>
									{arrayStudy.length !== 0 && arrayStudy.step.theory !== undefined && (
										<div className="chat_control" onClick={() => { this.onLocalPopup(true, 'theory'); }}>
											<div className="icon">
												{ t('structure.theory') }
											</div>
										</div>
									)}
								</div>
								<div className="chat_control">
									<div className="icon">
										{position === 'teacher' ? t('structure.teacher') : t('structure.student') }
										<i id="connect" className="fas fa-circle fa-error" />
									</div>
								</div>
							</div>
						</div>
						{ /*
						<div className="chat_control">
							<div className="icon">
								<i className="fas fa-sign-out-alt" />
							</div>
							<div className="icon">
								<i className="fas fa-comment" />
							</div>
							<div className="icon" onClick={() => { this.onReload(); }}>
								<i className="fas fa-redo" />
							</div>
						</div>
						*/}
						<div id="videos">
							<video id="local" autoPlay controls />
							<video id="remote" autoPlay controls />
						</div>
					</div>
				)}
			</div>
		);
	}
}

export default withRouter(withTranslation()(Space));
