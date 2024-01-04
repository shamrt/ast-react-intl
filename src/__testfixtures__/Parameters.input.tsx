import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function SiteHeader() {
  const [number] = useState(42);
  return (
    <span>
      My simple {number} text
      <span>Other text</span>
      Even more text
      <Link to="/other">Link</Link>
      Further text
    </span>
  );
}

export default SiteHeader;
