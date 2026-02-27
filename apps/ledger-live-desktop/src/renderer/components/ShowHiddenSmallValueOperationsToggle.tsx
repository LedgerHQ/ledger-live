import React from "react";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Switch from "~/renderer/components/Switch";
import Text from "~/renderer/components/Text";

type Props = Readonly<{
  isChecked: boolean;
  onChange: (value: boolean) => void;
}>;

export default function ShowHiddenSmallValueOperationsToggle({ isChecked, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <Box horizontal alignItems="center" flow={2}>
      <Text ff="Inter|SemiBold" fontSize={3} color="neutral.c70">
        {t("operationList.showHiddenSmallValueTransactions")}
      </Text>
      <Switch isChecked={isChecked} onChange={onChange} />
    </Box>
  );
}
