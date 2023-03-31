import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import Input from "~/renderer/components/Input";
import invariant from "invariant";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { track } from "~/renderer/analytics/segment";
const MemoValueField = ({
  onChange,
  account,
  transaction,
  status,
  trackProperties = {},
}: {
  onChange: (a: string) => void;
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  trackProperties?: object;
}) => {
  const { t } = useTranslation();
  invariant(transaction.family === "cardano", "Memo: cardano family expected");
  const bridge = getAccountBridge(account);
  const onMemoValueChange = useCallback(
    memo => {
      track("button_clicked", {
        ...trackProperties,
        button: "input",
        memo,
      });
      onChange(
        bridge.updateTransaction(transaction, {
          memo,
        }),
      );
    },
    [trackProperties, onChange, bridge, transaction],
  );
  return (
    <Input
      error={status.errors.memo}
      onChange={onMemoValueChange}
      placeholder={t("families.cardano.memoPlaceholder")}
    />
  );
};
export default MemoValueField;
