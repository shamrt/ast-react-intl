import React from 'react';
import { withSnackbar } from 'snackbar';

import { useIntl } from 'react-intl';

function Simple() {
  const intl = useIntl();
  return (
    <span>{intl.formatMessage({
        defaultMessage: 'My simple text'
      })}</span>
  );
}

export default withSnackbar(Simple);