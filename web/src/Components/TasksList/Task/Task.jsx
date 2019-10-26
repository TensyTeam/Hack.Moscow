import React from 'react';
import { Link } from 'react-router-dom';

import './Task.css';


const Task = (props) => {
	const {
		task,
	} = props;
	return (
		<div className="task">
			{task.id}
			{task.image}
			{task.text}
			{task.tags}
		</div>
	);
};

export default Task;
