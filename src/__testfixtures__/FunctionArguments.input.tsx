import React from 'react';

function FunctionArguments() {
  const typicalFunction = String('bar');
  const functionWithStringArg = String('My simple text');
  const functionWithObjectNonTextArg = String({ foo: 'bar' });
  const functionWithObjectTextArg = String({ title: 'My simple text' });

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
