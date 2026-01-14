import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/react-ui";

interface Props {
  accountsCount: number;
}

export const Title = ({ accountsCount }: Props) => {
  const { t } = useTranslation();

  return (
    <Text
      fontSize={24}
      textAlign="center"
      fontWeight="semiBold"
      color="neutral.c100"
      data-testid="accounts-added-title"
    >
      {t("modularAssetDrawer.accountsAdded.title", { count: accountsCount })}
    </Text>
  );
};
