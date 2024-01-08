import React from 'react';

import { useIntl } from 'react-intl';

function FunctionArguments() {
  const {
    formatMessage
  } = useIntl();

  const typicalFunction = String('bar');
  const functionWithStringArg = String(formatMessage({
    defaultMessage: 'My simple text'
  }));
  const functionWithObjectNonTextArg = String({ foo: 'bar' });
  const functionWithObjectTextArg = String({ title: formatMessage({
    defaultMessage: 'My simple text'
  }) });

  return (
    <div>
      {typicalFunction}
      {functionWithStringArg}
      {functionWithObjectNonTextArg}
      {functionWithObjectTextArg}
    </div>
  );
}

export default FunctionArguments;
