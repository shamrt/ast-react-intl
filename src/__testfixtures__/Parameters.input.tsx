import React, { useState } from 'react';

function SiteHeader() {
  const [number] = useState(42);
  return (
    <span>
      My simple {number} text
      <span>Other text</span>
      Even more Text
    </span>
  );
}

export default SiteHeader;
