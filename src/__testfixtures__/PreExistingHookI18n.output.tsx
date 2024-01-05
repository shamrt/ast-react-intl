import React, { useState } from 'react';

import { useIntl, FormattedMessage } from 'react-intl';

export default function SiteFooter() {
  const intl = useIntl();
  const [text] = useState(
    intl.formatMessage({
      defaultMessage: 'Something something',
    }),
  );
  return (<>
    {text}
    <span><FormattedMessage defaultMessage='My simple text' /></span>
  </>);
}