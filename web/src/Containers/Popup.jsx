import React from 'react';


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
							<div className="title">Success</div>
							<div className="subtitle">Your task has been published</div>
						</div>
					</div>
				)}
				{showPopup.current === 'error' && (
					<div className="popup">
						<div className="popup_close_panel" onClick={() => { onPopup(false, null); }} />
						<div className="popup_content">
							<div className="title">Error</div>
							<div className="subtitle">Fill in all the fields</div>
						</div>
					</div>
				)}
			</>
		);
	}
}

export default Popup;
