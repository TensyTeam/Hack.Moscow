import React from 'react';

import Task from './Task/Task.jsx';
import './TasksList.css';


const TasksList = (props) => {
	const {
		tasks, onCallTask,
	} = props;
	return (
		<div className="task_list">
			{tasks.map((task) => (
				<Task
					key={task.id}
					task={task}
					onCallTask={onCallTask}
				/>
			))}
		</div>
	);
};

export default TasksList;
