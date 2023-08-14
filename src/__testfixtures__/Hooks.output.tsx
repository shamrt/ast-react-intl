import React, { useState } from 'react';

import { useIntl } from 'react-intl';

function SiteHeader() {
  const intl = useIntl();
  const [text] = useState('');
  return (
    <span>{intl.formatMessage({
      defaultMessage: 'My simple text',
      description: 'DESCRIBE_ABOVE_TEXT_HERE'
    })}</span>
  );
}

export default SiteHeader;
