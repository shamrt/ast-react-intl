import React from 'react';

import { FormattedMessage, useIntl } from 'react-intl';

type CustomProps = {
  title: string;
};
function Custom(props: CustomProps) {
  return (
    <div>
      <span>{props.title}</span>
    </div>
  );
}

function Simple() {
  const intl = useIntl();
  return (
    (<div>
      <span><FormattedMessage defaultMessage='Simple text' /></span>
      <Custom title={intl.formatMessage({
        defaultMessage: 'Custom name'
      })} />
    </div>)
  );
}

export default Simple;
