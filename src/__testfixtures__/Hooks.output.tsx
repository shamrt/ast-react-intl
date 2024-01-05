import React, { useState } from 'react';

import { FormattedMessage } from 'react-intl';

function SiteHeader() {
  const [text] = useState('');
  return <span><FormattedMessage defaultMessage='My simple text' /></span>;
}

export default SiteHeader;
