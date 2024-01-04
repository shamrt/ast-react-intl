import React from 'react';

import { useIntl } from 'react-intl';

function Simple({ enabled, text }) {
  const intl = useIntl();

  return (
    (<div>
      <span>{intl.formatMessage({
        defaultMessage: 'My simple text',
        description: 'DESCRIBE_ABOVE_TEXT_HERE'
      })}</span>
      <span>{enabled ? intl.formatMessage({
          defaultMessage: 'OK',
          description: 'DESCRIBE_ABOVE_TEXT_HERE'
        }) : intl.formatMessage({
          defaultMessage: 'Not OK',
          description: 'DESCRIBE_ABOVE_TEXT_HERE'
        })}</span>
      <span>{text && text}</span>
    </div>)
  );
}

export default Simple;
