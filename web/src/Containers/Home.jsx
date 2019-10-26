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
			responce: false,
		};
		this.onCallTask = this.onCallTask.bind(this);
	}

	componentWillMount() {
		const { token } = this.props;
		getTasks(this).then((res) => {
			console.log(res);
			if (res.error === 0) {
				this.setState({ responce: true });
				this.setState({ tasks: res.result.tasks });
			}
        });

		socketIo.on('tasks_add', (mes) => {
			console.log('tasks_add', mes);
			let { tasks } = this.state;
			for (let m = 0; m < mes.length; m += 1) {
				if (mes[m].user !== token) {
					let t = true;
					for (let n = 0; n < tasks.length; n += 1) {
						if (mes[m].id === tasks[n].id) {
							t = false;
						}
					}
					if (t) {
						tasks = tasks.concat(mes[m]);
					}
				}
			}
			this.setState({ tasks });
		});

		socketIo.on('tasks_del', (mes) => {
			console.log('tasks_del', mes);
			let { tasks } = this.state;
			for (let m = 0; m < mes.length; m += 1) {
				if (mes[m].user !== token) {
					let t = true;
					for (let n = 0; n < tasks.length; n += 1) {
						if (mes[m].id === tasks[n].id) {
							t = false;
						}
					}
					if (t) {
						tasks = tasks.concat(mes[m]);
					}
				}
			}
			this.setState({ tasks });
		});
	}

	onCallTask(_taskId) {
		const { onRedirect } = this.props;
		startStudy(this, { id: _taskId }).then((mes) => {
			console.log('startStudy', mes);
			if (mes.error === 0) {
				onRedirect(`/space/${mes.result.id}/?type=teacher`);
			}
        });
	}

	render() {
		const { tasks, responce } = this.state;
		return (
			<div className="content">
				<div className="title title_group">
					<span>Online tasks</span>
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
					<>
						{responce ? (
							<div style={{ textAlign: 'center' }}>Not found</div>
						) : (
							<Loader />
						)}
					</>
				)}
			</div>
		);
	}
}

export default Home;
