import React from 'react';
import './Input.css';

const Input = (props) => {
    const {
        onClick, name, id, type, onChange, disabled, className, required, defaultValue, style, placeholder,
    } = props;
    return (
	<input
        id={id}
		name={name}
		type={type}
		onClick={onClick}
		onChange={onChange}
		className={className}
		disabled={disabled}
		required={required}
		defaultValue={defaultValue}
		style={style}
		placeholder={placeholder}
	/>
    );
};

export default Input;
