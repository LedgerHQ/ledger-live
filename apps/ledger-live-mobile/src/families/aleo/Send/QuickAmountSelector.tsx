import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { useTranslation } from "~/context/Locale";
import type { AfterAmountInputProps } from "~/screens/SendFunds/utils/customSendFlow";

export function QuickAmountSelector({ transaction }: Readonly<AfterAmountInputProps>) {
  const { t } = useTranslation();

  if (transaction.family !== "aleo" || !isPrivateTransaction(transaction)) {
    return null;
  }

  return (
    <Box lx={{ flex: 1 }}>
      <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {t("aleo.send.quickAmountSelector.mockTitle")}
      </Text>
    </Box>
  );
}
