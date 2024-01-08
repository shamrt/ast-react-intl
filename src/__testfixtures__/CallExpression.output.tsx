import { useIntl } from 'react-intl';
const callIt = ({ showSnackbar }) => {
  const {
    formatMessage
  } = useIntl();

  showSnackbar({ message: formatMessage({
    defaultMessage: 'User edited successfully!'
  }) });
};

export default callIt;
