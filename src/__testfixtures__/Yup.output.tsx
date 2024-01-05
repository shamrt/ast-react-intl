// TODO: This output could be improved by using an `injectIntl` HOC
import { withFormik } from 'formik';
import * as yup from 'yup';

import { FormattedMessage, useIntl } from 'react-intl';

function UserInnerForm() {
  return <span><FormattedMessage defaultMessage='user form here' /></span>;
}

type Values = {
  name: string;
  email: string;
};
const UserForm = withFormik({
  validationSchema: yup.object().shape({
    name: yup.string().required(intl.formatMessage({
      defaultMessage: 'Name is required'
    })),
    email: yup.string().required(intl.formatMessage({
      defaultMessage: 'Email is required'
    })),
  }),
  handleSubmit: (values: Values, formikBag) => {
    const { props } = formikBag;
    const { showSnackbar } = props;

    showSnackbar({ message: intl.formatMessage({
      defaultMessage: 'User edited successfully!'
    }) });
  },
})(UserInnerForm);

export default UserForm;
