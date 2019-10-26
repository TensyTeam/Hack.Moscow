import React from 'react';
import {
	BrowserRouter, Route, Switch, Redirect,
} from 'react-router-dom';


import Home from './Containers/Home.jsx';
import EditTask from './Containers/EditTask.jsx';
import Space from './Containers/Space.jsx';
import Popup from './Containers/Popup.jsx';
import Footer from './Components/Footer/Footer.jsx';

import { socketIo } from './Functions/api';


export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			token: [],
			showPopup: { active: false, current: null },
			redirect: { status: false, path: '/' },
		};
		this.onPopup = this.onPopup.bind(this);
		this.onRedirect = this.onRedirect.bind(this);
	}

	componentWillMount() {
		let tokenTemp;
		if (localStorage.getItem('token') !== null) {
			tokenTemp = JSON.parse(localStorage.getItem('token'));
			this.setState({ token: tokenTemp });
		} else {
			tokenTemp = Math.random().toString(36).substring(2, 15);
			localStorage.setItem('token', JSON.stringify(tokenTemp));
		}

		socketIo.emit('online', { token: tokenTemp });
		setInterval(() => {
			const { token } = this.state;
			socketIo.emit('online', { token });
		}, 5000);

		socketIo.on('student_accept', (mes) => {
			console.log('student_accept', mes);
			if (mes.user === JSON.parse(localStorage.getItem('token'))) {
				this.onRedirect(`/space/${mes.id}/?type=student`);
			}
		});
	}

	onPopup(_active, _current) {
		this.setState({ showPopup: { active: _active, current: _current } });
	}

	onRedirect(_path) {
		this.setState({ redirect: { status: true, path: _path } });
	}

	render() {
		const {
			showPopup, redirect, token,
		} = this.state;
		return (
			<BrowserRouter>
				<div className="module">
					{showPopup.active && (
						<Popup
							showPopup={showPopup}
							onPopup={this.onPopup}
							onRedirect={this.onRedirect}
						/>
					)}
					{/* <Header /> */ }
					<Switch>
						{redirect.status === true && (
							<>
								<Redirect to={redirect.path} />
								{this.setState({ redirect: { status: false, path: redirect.path } })}
							</>
						)}
						<Route exact path="/">
							<Home
								token={token}
								onPopup={this.onPopup}
								onRedirect={this.onRedirect}
							/>
						</Route>
						<Route exact path="/task/edit">
							<EditTask
								onPopup={this.onPopup}
								onRedirect={this.onRedirect}
							/>
						</Route>
						<Route exact path="/create/task">
							<EditTask
								onPopup={this.onPopup}
								onRedirect={this.onRedirect}
							/>
						</Route>
						<Route path="/space">
							<Space
								onPopup={this.onPopup}
								onRedirect={this.onRedirect}
							/>
						</Route>
					</Switch>
				</div>
				<Footer />
			</BrowserRouter>
		);
	}
}
