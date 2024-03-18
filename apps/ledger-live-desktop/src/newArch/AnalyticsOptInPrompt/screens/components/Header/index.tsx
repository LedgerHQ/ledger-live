import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/react-ui";

interface HeaderProps {
  title: string;
}

const Header = ({ title }: HeaderProps) => {
  const { t } = useTranslation();
  return (
    <Text variant="large" fontWeight="medium" fontSize={20}>
      {t(title)}
    </Text>
  );
};

export default Header;
