import React from "react";
import { Text } from "@ledgerhq/react-ui/index";
import { useTranslation } from "react-i18next";

export function Header() {
  const { t } = useTranslation();
  return (
    <Text fontSize="16px" fontWeight="semiBold" color="neutral.c100" padding="16px">
      {t("nftEntryPoint.title")}
    </Text>
  );
}
