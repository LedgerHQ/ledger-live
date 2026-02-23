import React from "react";
import { useTranslation } from "~/context/Locale";
import { Text } from "@ledgerhq/lumen-ui-rnative";

type HeaderTitleProps = {
  testID?: string;
  titleKey: string;
};

const HeaderTitle = ({ testID, titleKey }: Readonly<HeaderTitleProps>) => {
  const { t } = useTranslation();
  return (
    <Text typography="heading3SemiBold" lx={{ color: "base" }} testID={testID}>
      {t(titleKey)}
    </Text>
  );
};

export default HeaderTitle;
