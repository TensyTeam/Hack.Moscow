import React from 'react';

import Button from '../Components/UI/Button/Button.jsx';
import Loader from '../Components/UI/Loader/Loader.jsx';
import TasksList from '../Components/TasksList/TasksList.jsx';

import { getTasks, editTasks } from '../Functions/methods';

class Home extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			otherTasks: [],
			myTasks: [],
			newTask: {
				image: '',
				file: '',
				text: '',
				tags: [],
			},
		};
		this.onCreateTask = this.onCreateTask.bind(this);
	}

	componentWillMount() {
		getTasks(this, { my: false }).then((res) => {
			this.setState({ otherTasks: res });
        });
		getTasks(this, { my: true }).then((res) => {
			this.setState({ myTasks: res });
        });
	}

	onCreateTask() {
		const { onPopup } = this.props;
		const { newTask } = this.state;
		const {
			image, file, text, tags,
		} = newTask;
		if (text.length !== 0 && tags.length !== 0) {
			editTasks(this, {
				image, file, text, tags,
			}).then((res) => {
				if (res.error === 0) {
					onPopup(true, 'success');
				}
			});
		}
	}

	render() {
		const { otherTasks, myTasks } = this.state;
		return (
			<div className="content">
				<div className="title title_group">
					<span>My Tasks</span>
					<Button onClick={this.onCreateTask}>
						<i className="fas fa-plus" />
					</Button>
				</div>
				{myTasks.length !== 0 ? (
					<TasksList
						tasks={myTasks}
					/>
				) : (
					<Loader />
				)}
				<div className="title">Other Tasks</div>
				{otherTasks.length !== 0 ? (
					<TasksList
						tasks={otherTasks}
					/>
				) : (
					<Loader />
				)}
			</div>
		);
	}
}

export default Home;
