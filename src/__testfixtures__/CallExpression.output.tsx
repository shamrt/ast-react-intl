import { useIntl } from 'react-intl';

const callIt = ({ showSnackbar }) => {
  const intl = useIntl();
  showSnackbar({ message: intl.formatMessage({
    defaultMessage: 'User edited successfully!',
    description: 'DESCRIBE_ABOVE_TEXT_HERE'
  }) });
};

export default callIt;
