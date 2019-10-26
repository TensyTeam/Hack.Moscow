import React from 'react';
import { Link } from 'react-router-dom';

import './Task.css';
import { dateFormat } from '../../../Functions/handle';


const Task = (props) => {
	const {
		task, onCallTask,
	} = props;
	return (
		<div className="task" key={task.id} onClick={() => { onCallTask(task.id); }}>
			<div className="task_left">
				{task.image !== 'https://tensyteam.ru/load/tasks/0.png' && (
					<img src={task.image} alt="" />
				)}
			</div>
			<div className="task_right">
				<div className="task_title">{task.text}</div>
				<div className="task_date">{dateFormat(task.time * 1000)}</div>
				<div className="task_tags">
					{task.tags.map((tag) => (
						<span className="tag" key={tag}>{tag}</span>
					))}
				</div>
				<div className="task_user">
					<i className="fas fa-user" />
					{task.user}
				</div>
			</div>
		</div>
	);
};

export default Task;
