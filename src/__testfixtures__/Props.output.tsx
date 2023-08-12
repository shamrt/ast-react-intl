import React from 'react';

import { useTranslation } from 'react-i18next';

type CustomProps = {
  title: string;
};
function Custom(props: CustomProps) {
  return (
    <div>
      <span>{props.title}</span>
    </div>
  );
}

function Component123() {
  const { t } = useTranslation();

  return (
    <div>
      <span>{t('simple_text')}</span>
      <Custom title={t('custom_name')} />
    </div>
  );
}

export default Component123;
