import React from 'react';
// import { Link } from 'react-router-dom';

import Input from '../Components/UI/Input/Input.jsx';
import Button from '../Components/UI/Button/Button.jsx';


class Popup extends React.Component {
	render() {
		const {
			showPopup, onPopup,
		} = this.props;
		return (
			<>
				{showPopup.current === 'success' && (
					<div className="popup">
						<div className="popup_close_panel" onClick={() => { onPopup(false, null); }} />
						<div className="popup_content">
							<div className="title">Успешно</div>
							<div className="title">Ваш вопрос опубликован</div>
						</div>
					</div>
				)}
			</>
		);
	}
}

export default Popup;
