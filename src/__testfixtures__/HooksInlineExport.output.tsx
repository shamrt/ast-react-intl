import React, { useState } from "react";

import { FormattedMessage, useIntl } from 'react-intl';

export default function SiteFooter() {
  const intl = useIntl();
  const [text] = useState(intl.formatMessage({
    defaultMessage: 'Something something'
  }));
  return (<>
    {text}
    <span><FormattedMessage defaultMessage='My simple text' /></span>
  </>);
}