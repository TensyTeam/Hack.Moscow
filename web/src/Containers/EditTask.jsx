import React from 'react';
import { Link } from 'react-router-dom';

import Button from '../Components/UI/Button/Button.jsx';
import Input from '../Components/UI/Input/Input.jsx';
import { editTasks } from '../Functions/methods';

class EditTask extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			newTask: {
				image: '',
				file: '',
				text: '',
				tags: [],
			},
			responce: false,
		};
		this.onCreateTask = this.onCreateTask.bind(this);
	}

	onCreateTask() {
		const { onPopup } = this.props;
		const { newTask } = this.state;
		const {
			image, file, text, tags,
		} = newTask;
		this.setState({ responce: true });
		if (text.length !== 0 && tags.length !== 0) {
			const arrayOutput = {
				text, tags,
			};
			if (image.length !== 0) {
				arrayOutput.image = image;
				arrayOutput.file = file;
			}
			onPopup(true, 'loader');
			editTasks(this, arrayOutput).then((res) => {
				this.setState({ responce: false });
				if (res.error === 0) {
					this.setState({
						newTask: {
							image: '',
							file: '',
							text: '',
							tags: [],
						},
					});
					document.getElementById('task_cover_img').src = '';
					onPopup(true, 'success');
				}
			});
		} else {
			onPopup(true, 'error');
		}
	}

	handleNewTask(_e, index, _type) {
		const { newTask } = this.state;
		if (_type === 'image') {
			const cover = _e.target.files;
			const fileReader = new FileReader();
			fileReader.onload = (_eventFileReader) => {
				const base64 = _eventFileReader.target.result;
				document.getElementById('task_cover_img').src = base64;
				this.setState({ newTask: { ...newTask, image: base64.split(',')[1], file: cover[0].name } });
			};
			fileReader.readAsDataURL(cover[0]);
		} else if (_type === 'text') {
			this.setState({ newTask: { ...newTask, text: _e.target.value } });
		} else if (_type === 'tags') {
			const valueTemp = _e.target.value.split(',');
			const tags = [];
			for (let m = 0; m < valueTemp.length; m += 1) {
				if (valueTemp[m] !== '') {
					tags.push(valueTemp[m].replace(/\s/g, '').toLowerCase());
				}
			}
			this.setState({ newTask: { ...newTask, tags } });
		}
	}

	render() {
		const { newTask, responce } = this.state;
		return (
			<div className="content">
				<div className="title title_group">
					<span>Create task</span>
					<Link to="/" className="btn">
						<i className="fas fa-times" />
					</Link>
				</div>
				<div className="form">
					<Input
						name="text"
						type="text"
						placeholder="For text"
						value={newTask.text}
						style={responce && newTask.text.length === 0 ? { background: '#ff7979' } : {}}
						onChange={(_e) => { this.handleNewTask(_e, null, 'text'); }}
					/>
					<Input
						name="tags"
						type="text"
						placeholder="For tags"
						value={newTask.tags}
						style={responce && newTask.tags.length === 0 ? { background: '#ff7979' } : {}}
						onChange={(_e) => { this.handleNewTask(_e, null, 'tags'); }}
					/>
					<img id="task_cover_img" className="task_img" src="https://tensyteam.ru/static/ladders/0.png" alt="" />
					<label className="btn btn-file" id="cover_btn" htmlFor="cover">
						<Input
							id="cover"
							name="image"
							type="file"
							className="input-file"
							placeholder="For image"
							defaultValue={newTask.image}
							onChange={(_e) => { this.handleNewTask(_e, null, 'image'); }}
						/>
						<i className="fas fa-file-upload" />
						<span>Upload img</span>
					</label>
					<Button onClick={responce ? {} : this.onCreateTask}>
						Create
					</Button>
				</div>
			</div>
		);
	}
}

export default EditTask;
