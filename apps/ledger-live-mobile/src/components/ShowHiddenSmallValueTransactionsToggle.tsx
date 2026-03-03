import React from "react";
import { Box, Switch, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  enabled: boolean;
  onChange: (value: boolean) => void;
}>;

export default function ShowHiddenSmallValueTransactionsToggle({ enabled, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: "s16",
        paddingBottom: "s16",
      }}
    >
      <Text
        typography="body2SemiBold"
        lx={{ color: "muted", flex: 1, marginRight: "s16" }}
      >
        {t("operationList.showHiddenSmallValueTransactions")}
      </Text>
      <Switch checked={enabled} onCheckedChange={onChange} />
    </Box>
  );
}
