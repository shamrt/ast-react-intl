import React from 'react';

type CustomProps = {
  title: string;
};
function Custom(props: CustomProps) {
  return (
    <div>
      <span>{props.title}</span>
    </div>
  );
}

function Simple() {
  return (
    <div>
      <span>Simple text</span>
      <Custom title="Custom name" />
    </div>
  );
}

export default Simple;
