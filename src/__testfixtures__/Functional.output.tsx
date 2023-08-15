import React from 'react';

import { useIntl } from 'react-intl';

function Simple() {
  const intl = useIntl();
  return (
    <span>{intl.formatMessage({
      defaultMessage: 'My simple text',
      description: 'DESCRIBE_ABOVE_TEXT_HERE'
    })}</span>
  );
}

export default Simple;