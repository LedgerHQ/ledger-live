import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import Input from "~/renderer/components/Input";
import invariant from "invariant";
import {
  CardanoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";
import { track } from "~/renderer/analytics/segment";
import MemoTagField from "~/newArch/features/MemoTag/components/MemoTagField";

const MemoValueField = ({
  onChange,
  account,
  transaction,
  status,
  trackProperties,
}: {
  onChange: (a: Transaction) => void;
  account: CardanoAccount;
  transaction: Transaction;
  status: TransactionStatus;
  trackProperties?: Record<string, unknown>;
}) => {
  const { t } = useTranslation();
  invariant(transaction.family === "cardano", "Memo: cardano family expected");
  const bridge = getAccountBridge(account);
  const onMemoValueChange = useCallback(
    (memo: string) => {
      track("button_clicked2", {
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
  return <MemoTagField error={status.errors.memo} onChange={onMemoValueChange} />;
};
export default MemoValueField;
