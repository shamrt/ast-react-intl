import React, { useState } from "react";

import { useIntl } from 'react-intl';

export default function SiteFooter() {
  const intl = useIntl();
  const [text] = useState(intl.formatMessage({
    defaultMessage: 'Something something',
    description: 'DESCRIBE_ABOVE_TEXT_HERE'
  }));
  return (<>
    {text}
    <span>{intl.formatMessage({
      defaultMessage: 'My simple text',
      description: 'DESCRIBE_ABOVE_TEXT_HERE'
    })}</span>
  </>);
}