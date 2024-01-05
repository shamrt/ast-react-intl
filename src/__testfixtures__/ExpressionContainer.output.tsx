import React from 'react';

import { useIntl } from 'react-intl';

function Simple({ enabled, text }) {
  const intl = useIntl();

  return (<>
    <div>
      <span>{enabled ? intl.formatMessage({
          defaultMessage: 'OK',
        }) : intl.formatMessage({
          defaultMessage: 'Not OK',
        })}</span>
      <span>{text && text}</span>
    </div>
    <div>
      <span>{intl.formatMessage({
          defaultMessage: 'My simple text {arg1}'
        }, {
          'arg1': enabled ? 'OK' : 'Not OK'
        })}</span>
    </div>
  </>);
}

export default Simple;
