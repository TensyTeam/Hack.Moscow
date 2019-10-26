import React from 'react';
import { Link } from 'react-router-dom';

import Loader from '../Components/UI/Loader/Loader.jsx';
import TasksList from '../Components/TasksList/TasksList.jsx';

import { getTasks } from '../Functions/methods';

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
					/>
				) : (
					<Loader />
				)}
			</div>
		);
	}
}

export default Home;
