import { useIntl } from 'react-intl';
const callIt = ({ showSnackbar }) => {
  const intl = useIntl();
  showSnackbar({ message: intl.formatMessage({
    defaultMessage: 'User edited successfully!'
  }) });
};

export default callIt;
