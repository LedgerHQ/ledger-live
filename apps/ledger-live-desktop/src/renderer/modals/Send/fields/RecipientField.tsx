import React, { memo, useCallback, useEffect, useState } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Account } from "@ledgerhq/types-live";
import { TFunction } from "react-i18next";

import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import RecipientFieldBase from "./RecipientFieldBase";
import RecipientFieldNamingService from "./RecipientFieldNamingService";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

type Props = {
  account: Account;
  transaction: Transaction;
  autoFocus?: boolean;
  status: TransactionStatus;
  onChangeTransaction: (tx: Transaction) => void;
  t: TFunction;
  label?: React.ReactNode;
  initValue?: string;
  resetInitValue?: () => void;
};

const RecipientField = ({
  t,
  account,
  transaction,
  onChangeTransaction,
  autoFocus,
  status,
  label,
  initValue,
  resetInitValue,
}: Props) => {
  const bridge = getAccountBridge(account, null);
  const [value, setValue] = useState(
    initValue || transaction.recipientName || transaction.recipient || "",
  );
  const FFNamingService = useFeature("trustedNameInputResolution");

  useEffect(() => {
    if (value !== "" && value !== transaction.recipient) {
      onChangeTransaction(bridge.updateTransaction(transaction, { recipient: value }));
      resetInitValue && resetInitValue();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = useCallback(
    async (recipient: string, maybeExtra?: Record<string, CryptoCurrency>) => {
      const { currency } = maybeExtra || {}; // FIXME fromQRCode ?
      const invalidRecipient = currency && currency.scheme !== account.currency.scheme;
      setValue(recipient);
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          recipient: invalidRecipient ? "" : recipient,
          recipientName: undefined,
        }),
      );
    },
    [bridge, account, transaction, onChangeTransaction],
  );

  if (!status) return null;

  return FFNamingService?.enabled ? (
    <RecipientFieldNamingService
      t={t}
      label={label}
      autoFocus={autoFocus}
      status={status}
      account={account}
      value={value}
      transaction={transaction}
      onChange={onChange}
      onChangeTransaction={onChangeTransaction}
      bridge={bridge}
    />
  ) : (
    <RecipientFieldBase
      t={t}
      label={label}
      autoFocus={autoFocus}
      status={status}
      account={account}
      value={value}
      onChange={onChange}
    />
  );
};

export default memo(RecipientField);
