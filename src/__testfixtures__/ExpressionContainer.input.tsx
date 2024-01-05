import React from 'react';

function Simple({ enabled, text }) {
  return (
    <>
      <div>
        <span>{enabled ? 'OK' : 'Not OK'}</span>
        <span>{text && text}</span>
      </div>
      <div>
        <span>My simple text {enabled ? 'OK' : 'Not OK'}</span>
      </div>
    </>
  );
}

export default Simple;
