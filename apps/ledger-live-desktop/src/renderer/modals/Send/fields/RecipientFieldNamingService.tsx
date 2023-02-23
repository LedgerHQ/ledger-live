import React, { memo, useCallback, useEffect, useMemo } from "react";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { TFunction } from "react-i18next";

import { useNamingService } from "@ledgerhq/live-common/naming-service/index";
import {
  NamingServiceResponseLoaded,
  UseNamingServiceResponse,
} from "@ledgerhq/live-common/naming-service/types";

import RecipientFieldBase from "./RecipientFieldBase";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

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
  value: string | string;
  bridge: AccountBridge<Transaction>;
  onChange: (recipient: string, maybeExtra?: Record<string, CryptoCurrency>) => Promise<void>;
};

const RecipientField = ({
  t,
  account,
  transaction,
  onChangeTransaction,
  autoFocus,
  status,
  label,
  value = "",
  bridge,
  onChange,
}: Props) => {
  const namingServiceResponse = useNamingService(value);
  const hasValidatedName = useCallback(
    (nsResponse: UseNamingServiceResponse): nsResponse is NamingServiceResponseLoaded =>
      nsResponse.status === "loaded",
    [],
  );

  useEffect(() => {
    const isInitValueDifferent = value !== transaction.recipientName;
    const isRecipientUpdated = transaction.recipient === transaction.recipientName;
    if (hasValidatedName(namingServiceResponse) && (isRecipientUpdated || isInitValueDifferent)) {
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          recipient: namingServiceResponse.address,
          recipientName: value,
        }),
      );
    }
  }, [bridge, transaction, onChangeTransaction, namingServiceResponse, hasValidatedName, value]);

  return (
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
