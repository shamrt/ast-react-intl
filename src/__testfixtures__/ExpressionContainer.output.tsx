import React from 'react';

import { FormattedMessage, useIntl } from 'react-intl';

function Simple({ enabled, text }) {
  const intl = useIntl();
  return (<>
    <div>
      <span>{enabled ? intl.formatMessage({
        defaultMessage: 'OK'
      }) : intl.formatMessage({
        defaultMessage: 'Not OK'
      })}</span>
      <span>{enabled ? intl.formatMessage({
        defaultMessage: 'OK'
      }) : null}</span>
      <span>{enabled ? null : intl.formatMessage({
        defaultMessage: 'Not OK'
      })}</span>
      <span>{text && text}</span>
    </div>{' '}
    <div>
      <span><FormattedMessage
          defaultMessage='My simple text {arg1}'
          values={{
            'arg1': enabled ? 'OK' : 'Not OK'
          }} /></span>
    </div>
  </>);
}

export default Simple;
