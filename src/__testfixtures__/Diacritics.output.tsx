import React from 'react';

import { useIntl } from 'react-intl';

function Simple() {
  const intl = useIntl();
  return (
    <span>{intl.formatMessage({
        defaultMessage: 'Olá Antônio'
      })}</span>
  );
}

export default Simple;
