// TODO: This output could be improved by using an `injectIntl` HOC
import { withFormik } from 'formik';
import * as yup from 'yup';

function UserInnerForm() {
  return <span>user form here</span>;
}

type Values = {
  name: string;
  email: string;
};
const UserForm = withFormik({
  validationSchema: yup.object().shape({
    name: yup.string().required('Name is required'),
    email: yup.string().required('Email is required'),
  }),
  handleSubmit: (values: Values, formikBag) => {
    const { props } = formikBag;
    const { showSnackbar } = props;

    showSnackbar({ message: 'User edited successfully!' });
  },
})(UserInnerForm);

export default UserForm;
