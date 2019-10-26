import React from 'react';
import { Link } from 'react-router-dom';

import './Task.css';
import { dateFormat } from '../../../Functions/handle';


const Task = (props) => {
	const {
		task,
	} = props;
	return (
		<Link to={`card/${task.id}`} className="task">
			<div className="task_left">
				<img src={task.image} alt="" />
			</div>
			<div className="task_right">
				<div className="task_title">{task.text}</div>
				<div className="task_date">{dateFormat(task.time * 1000)}</div>
				<div className="task_tags">
					{task.tags.map((tag) => (
						<span className="tag">{tag}</span>
					))}
				</div>
				<div className="task_user">
					<i className="fas fa-user" />
					{task.user}
				</div>
			</div>
		</Link>
	);
};

export default Task;
