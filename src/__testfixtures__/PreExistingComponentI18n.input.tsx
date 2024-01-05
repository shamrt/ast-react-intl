import React from 'react';

import { FormattedMessage } from 'react-intl';

function Simple() {
  showSnackbar({ message: 'User edited successfully!' });

  return (
    <span>
      <FormattedMessage defaultMessage="My simple text" />
    </span>
  );
}

export default Simple;
