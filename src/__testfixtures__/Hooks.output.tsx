import React, { useState } from 'react';

import { useIntl } from 'react-intl';

function SiteHeader() {
  const intl = useIntl();
  const [text] = useState('');
  return (
    <span>{intl.formatMessage({
      defaultMessage: 'My simple text'
    })}</span>
  );
}

export default SiteHeader;
