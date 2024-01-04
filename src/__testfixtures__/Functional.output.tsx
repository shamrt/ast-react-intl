import React from 'react';

import { useIntl } from 'react-intl';

function Simple() {
  const intl = useIntl();
  return (
    <span>{intl.formatMessage({
        defaultMessage: 'My simple text'
      })}</span>
  );
}

export default Simple;