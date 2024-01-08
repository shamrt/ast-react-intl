import React from 'react';

import { useIntl } from 'react-intl';

function FunctionArguments() {
  const intl = useIntl();
  const typicalFunction = String('bar');
  const functionWithStringArg = String(intl.formatMessage({
    defaultMessage: 'My simple text'
  }));
  const functionWithObjectNonTextArg = String({ foo: 'bar' });
  const functionWithObjectTextArg = String({ title: intl.formatMessage({
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
