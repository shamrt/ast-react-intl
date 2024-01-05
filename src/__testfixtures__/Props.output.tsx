import React from 'react';

import { useIntl } from 'react-intl';

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
  const intl = useIntl();
  const enabled = true;
  return (
    (<div>
      <Custom title={intl.formatMessage({
        defaultMessage: 'Custom name'
      })} />
      {/* eslint-disable-next-line react/jsx-curly-brace-presence */}
      <Custom placeholder={intl.formatMessage({
        defaultMessage: 'Custom name'
      })} />
      <img alt={enabled ? intl.formatMessage({
        defaultMessage: 'OK'
      }) : intl.formatMessage({
        defaultMessage: 'Not OK'
      })} />
    </div>)
  );
}

export default Component123;
