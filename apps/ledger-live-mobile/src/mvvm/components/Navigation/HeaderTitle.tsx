import React from "react";
import { useTranslation } from "~/context/Locale";
import { Text } from "@ledgerhq/lumen-ui-rnative";

type HeaderTitleProps = {
  testID?: string;
  titleKey?: string;
  children?: React.ReactNode;
};

const HeaderTitle = ({ testID, titleKey, children }: Readonly<HeaderTitleProps>) => {
  const { t } = useTranslation();
  const label = titleKey === undefined ? children : t(titleKey);
  return (
    <Text typography="heading3SemiBold" lx={{ color: "base" }} testID={testID}>
      {label}
    </Text>
  );
};

export default HeaderTitle;
