import React, { useState } from 'react';
import { defineMessage, MessageDescriptor, useIntl } from 'react-intl';

const messages: ReadonlyArray<MessageDescriptor> = [
  defineMessage({
    defaultMessage: 'Contacts',
  }),
];

function Simple() {
  const intl = useIntl();
  const [text] = useState(intl.formatMessage(messages[0]));
  return text;
}

export default Simple;
