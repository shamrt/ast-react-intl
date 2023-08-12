import React from 'react';

function Simple({ enabled, text }) {
  return (
    <div>
      <span>My simple text</span>
      <span>{enabled ? 'OK' : 'Not OK'}</span>
      <span>{text && text}</span>
    </div>
  );
}

export default Simple;
