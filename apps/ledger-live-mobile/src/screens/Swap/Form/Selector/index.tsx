import React from "react";
import { useTranslation } from "react-i18next";
import { Text, Box } from "@ledgerhq/native-ui";
import { SwapTransactionType } from "@ledgerhq/live-common/lib/exchange/swap/types";
import { Account } from "./Account";

interface Props {
  swapTx: SwapTransactionType;
}

export function Selector({ swapTx }: Props) {
  const { t } = useTranslation();

  return (
    <Box flex={1}>
      <Account label={t("transfer.swap2.form.from")} amount={0} />
      <Account label={t("transfer.swap2.form.to")} amount={0} />
    </Box>
  );
}
