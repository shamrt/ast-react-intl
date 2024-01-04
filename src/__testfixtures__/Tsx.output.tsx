import React from 'react';

import { useIntl } from 'react-intl';

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
      <span>{intl.formatMessage({
        defaultMessage: 'Simple text',
        description: 'DESCRIBE_ABOVE_TEXT_HERE'
      })}</span>
      <Custom title={intl.formatMessage({
        defaultMessage: 'Custom name',
        description: 'DESCRIBE_ABOVE_TEXT_HERE'
      })} />
    </div>)
  );
}

export default Simple;
