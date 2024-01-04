import { withFormik } from 'formik';
import * as yup from 'yup';

import { useIntl } from 'react-intl';

function UserInnerForm() {
  return (
    <span>{intl.formatMessage({
      defaultMessage: 'user form here',
      description: 'DESCRIBE_ABOVE_TEXT_HERE'
    })}</span>
  );
}

type Values = {
  name: string;
  email: string;
};
const UserForm = withFormik({
  validationSchema: yup.object().shape({
    name: yup.string().required(intl.formatMessage({
      defaultMessage: 'Name is required',
      description: 'DESCRIBE_ABOVE_TEXT_HERE'
    })),
    email: yup.string().required(intl.formatMessage({
      defaultMessage: 'Email is required',
      description: 'DESCRIBE_ABOVE_TEXT_HERE'
    })),
  }),
  handleSubmit: (values: Values, formikBag) => {
    const { props } = formikBag;
    const { showSnackbar } = props;

    showSnackbar({ message: intl.formatMessage({
      defaultMessage: 'User edited successfully!',
      description: 'DESCRIBE_ABOVE_TEXT_HERE'
    }) });
  },
})(UserInnerForm);

export default UserForm;
