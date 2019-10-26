import React from 'react';
import { Link } from 'react-router-dom';

import Loader from '../Components/UI/Loader/Loader.jsx';
import TasksList from '../Components/TasksList/TasksList.jsx';

import { getTasks, startStudy } from '../Functions/methods';
import { socketIo } from '../Functions/api';


class Home extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			tasks: [],
		};
	}

	componentWillMount() {
		getTasks(this).then((res) => {
			if (res.error === 0) {
				this.setState({ tasks: res.result.tasks });
			}
        });

		socketIo.on('tasks_add', (mes) => {
			console.log('tasks_add', mes);
			const { tasks } = this.state;
			for (let m = 0; m < tasks.length; m += 1) {
				for (let n = 0; n < mes.length; n += 1) {
					if (tasks[m].id === mes[n].id) {
						tasks.splice(m, 1);
						// break;
					}
				}
			}
			this.setState({ tasks: tasks.concat(mes) });
		});

		socketIo.on('tasks_del', (mes) => {
			console.log('tasks_del', mes);
			const { tasks } = this.state;
			for (let m = 0; m < tasks.length; m += 1) {
				for (let n = 0; n < mes.length; n += 1) {
					if (tasks[m].id === mes[n].id) {
						tasks.splice(m, 1);
						// break;
					}
				}
			}
			this.setState({ tasks });
		});
	}

	onCallTask(_taskId) {
		startStudy(this, { id: _taskId }).then((mes) => {
			console.log('startStudy', mes);
			if (mes.error === 0) {
				this.onRedirect(`/space/${_taskId}/?type=teacher`);
			}
        });
	}

	render() {
		const { tasks } = this.state;
		console.log(tasks);
		return (
			<div className="content">
				<div className="title title_group">
					<span>Tasks</span>
					<Link to="/create/task" className="btn">
						<i className="fas fa-plus" />
					</Link>
				</div>
				{tasks.length !== 0 ? (
					<TasksList
						tasks={tasks}
						onCallTask={this.onCallTask}
					/>
				) : (
					<Loader />
				)}
			</div>
		);
	}
}

export default Home;
