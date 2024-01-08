import React, { useState } from "react";

import { FormattedMessage, useIntl } from 'react-intl';

export default function SiteFooter() {
  const {
    formatMessage
  } = useIntl();

  const [text] = useState(formatMessage({
    defaultMessage: 'Something something'
  }));
  return (<>
    {text}
    <span><FormattedMessage defaultMessage='My simple text' /></span>
  </>);
}