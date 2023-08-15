import React from 'react';

import { useIntl } from 'react-intl';

class MyClass extends React.Component {
  render() {
    const { t } = this.props;
    return (
      <div>
        <span>{t('my_great_class_component')}</span>
      </div>
    );
  }
}

export default withTranslation()(MyClass);
