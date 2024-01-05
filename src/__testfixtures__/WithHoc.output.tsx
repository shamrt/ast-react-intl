import React from 'react';
import { withSnackbar } from 'snackbar';

import { FormattedMessage } from 'react-intl';

function Simple() {
  return <span><FormattedMessage defaultMessage='My simple text' /></span>;
}

export default withSnackbar(Simple);