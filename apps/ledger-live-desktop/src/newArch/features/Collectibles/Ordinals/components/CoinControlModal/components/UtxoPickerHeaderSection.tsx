import React from "react";
import { Text, Flex } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

export const UtxoPickerHeaderSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column">
      <Text variant="body" fontSize={14} ff="Inter|SemiBold">
        {t("ordinals.coinControl.utxos")}
      </Text>
      <Text color="neutral.c70" fontSize={14} variant="bodyLineHeight">
        {t("ordinals.coinControl.selectDesc")}
      </Text>
    </Flex>
  );
};
