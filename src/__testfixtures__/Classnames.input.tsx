import React from 'react';
import classNames from 'classnames';

function Button({ isPrimary, title }) {
  const className = classNames('special-button', {
    'special-button--primary': isPrimary,
  });

  return (
    <button type="button" className={className}>
      {title}
    </button>
  );
}

export default Button;
