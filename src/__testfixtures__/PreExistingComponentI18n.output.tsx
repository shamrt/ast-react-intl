import React from 'react';

import { FormattedMessage, useIntl } from 'react-intl';

function Simple() {
  const {
    formatMessage
  } = useIntl();

  showSnackbar({ message: formatMessage({
    defaultMessage: 'User edited successfully!'
  }) });

  return (
    <span>
      <FormattedMessage defaultMessage="My simple text" />
    </span>
  );
}

export default Simple;
