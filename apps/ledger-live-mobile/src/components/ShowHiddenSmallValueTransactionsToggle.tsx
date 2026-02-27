import React from "react";
import { Flex, Switch, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  enabled: boolean;
  onChange: (value: boolean) => void;
}>;

export default function ShowHiddenSmallValueTransactionsToggle({ enabled, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <Flex px={4} pb={4} flexDirection="row" alignItems="center" justifyContent="space-between">
      <Text variant="paragraph" fontWeight="semiBold" color="neutral.c80" flex={1} mr={4}>
        {t("operationList.showHiddenSmallValueTransactions")}
      </Text>
      <Switch checked={enabled} onChange={onChange} />
    </Flex>
  );
}
