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

function Component123() {
  const intl = useIntl();
  return (
    (<div>
      <span>{intl.formatMessage({
        defaultMessage: 'Simple text'
      })}</span>
      <Custom title={intl.formatMessage({
        defaultMessage: 'Custom name'
      })} />
    </div>)
  );
}

export default Component123;
