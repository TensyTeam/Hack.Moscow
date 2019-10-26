import React from 'react';
import {
	BrowserRouter, Route, Switch, Redirect,
} from 'react-router-dom';


import Home from './Containers/Home.jsx';
import EditTask from './Containers/EditTask.jsx';
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
		if (localStorage.getItem('token') !== null) {
			this.setState({ token: JSON.parse(localStorage.getItem('token')) });
		} else {
			const token = '123';
			localStorage.setItem('token', JSON.stringify(token));
		}

		setInterval(() => {
			const { token } = this.state;
			socketIo.emit('online', { token });
		}, 5000);
	}

	onPopup(_active, _current) {
		this.setState({ showPopup: { active: _active, current: _current } });
	}

	onRedirect(_path) {
		this.setState({ redirect: { status: true, path: _path } });
	}

	render() {
		const {
			showPopup, redirect,
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
					</Switch>
				</div>
				<Footer />
			</BrowserRouter>
		);
	}
}
