import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { FormattedMessage } from 'react-intl';

function SiteHeader() {
  const [number] = useState(42);
  return (
    <span><FormattedMessage
        defaultMessage='My simple {number} text <span3>Other text</span3> Even more text <Link5>Link</Link5> Further text'
        values={{
          'number': number,
          'span3': chunks => <span>{chunks}</span>,
          'Link5': chunks => <Link to="/other">{chunks}</Link>
        }} /></span>
  );
}

export default SiteHeader;
