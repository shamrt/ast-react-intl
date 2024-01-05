import React from 'react';

type CustomProps = {
  title?: string;
  placeholder?: string;
};
function Custom({ title, placeholder }: CustomProps) {
  return (
    <div>
      <span>{title}</span>
      <input type="text" placeholder={placeholder} />
    </div>
  );
}
Custom.defaultProps = {
  title: 'Foo',
  placeholder: 'Bar',
};

function Component123() {
  const enabled = true;
  return (
    <div>
      <Custom title="Custom name" />
      {/* eslint-disable-next-line react/jsx-curly-brace-presence */}
      <Custom placeholder={'Custom name'} />
      <img alt={enabled ? 'OK' : 'Not OK'} />
    </div>
  );
}

export default Component123;
