import { useTranslation } from 'react-i18next';

const callIt = ({ showSnackbar }) => {
  const { t } = useTranslation();
  showSnackbar({ message: t('user_edited_successfully') });
};

export default callIt;
