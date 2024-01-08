import React from 'react';

import { FormattedMessage, useIntl } from 'react-intl';

function Simple({ enabled, text }) {
  const {
    formatMessage
  } = useIntl();

  return (<>
    <div>
      <span>{enabled ? formatMessage({
        defaultMessage: 'OK'
      }) : formatMessage({
        defaultMessage: 'Not OK'
      })}</span>
      <span>{enabled ? formatMessage({
        defaultMessage: 'OK'
      }) : null}</span>
      <span>{enabled ? null : formatMessage({
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
