import React from "react";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import MemoValueField from "./MemoValueField";
import {
  CardanoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";
const Root = (props: {
  account: CardanoAccount;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (t: Transaction) => void;
  trackProperties?: Record<string, unknown>;
}) => {
  const { t } = useTranslation();
  return (
    <Box flow={1}>
      <Box mb={10}>
        <Label>
          <span>{t("families.cardano.memo")}</span>
        </Label>
      </Box>
      <Box mb={15} horizontal grow alignItems="center" justifyContent="space-between">
        <Box grow={1}>
          <MemoValueField {...props} />
        </Box>
      </Box>
    </Box>
  );
};
export default {
  component: Root,
  fields: ["memo"],
};
