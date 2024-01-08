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
  const {
    formatMessage
  } = useIntl();

  const enabled = true;
  return (
    (<div>
      <Custom title={formatMessage({
        defaultMessage: 'Custom name'
      })} />
      {/* eslint-disable-next-line react/jsx-curly-brace-presence */}
      <Custom
        placeholder={formatMessage({
          defaultMessage: 'Custom name'
        })}
        data-testid={enabled ? 'test-id' : undefined}
      />
      <img alt={enabled ? formatMessage({
        defaultMessage: 'OK'
      }) : formatMessage({
        defaultMessage: 'Not OK'
      })} />
    </div>)
  );
}

export default Component123;
