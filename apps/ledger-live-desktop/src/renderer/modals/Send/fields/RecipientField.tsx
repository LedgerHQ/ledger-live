import React, { memo, useCallback, useEffect, useState } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Account } from "@ledgerhq/types-live";
import type { TFunction } from "i18next";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import RecipientFieldBase from "./RecipientFieldBase";
import RecipientFieldDomainService from "./RecipientFieldDomainService";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { OnChangeExtra } from "~/renderer/components/RecipientAddress";

type Props<T extends Transaction, TS extends TransactionStatus> = {
  account: Account;
  transaction: T;
  autoFocus?: boolean;
  status: TS;
  onChangeTransaction: (tx: T) => void;
  t: TFunction;
  label?: React.ReactNode;
  initValue?: string;
  resetInitValue?: () => void;
};

const RecipientField = <T extends Transaction, TS extends TransactionStatus>({
  t,
  account,
  transaction,
  onChangeTransaction,
  autoFocus,
  status,
  label,
  initValue,
  resetInitValue,
}: Props<T, TS>) => {
  const bridge = getAccountBridge(account, null);
  const [value, setValue] = useState(
    initValue || transaction?.recipientDomain?.domain || transaction.recipient || "",
  );

  const { enabled: isDomainResolutionEnabled, params } = useFeature("domainInputResolution") || {};
  const isCurrencySupported =
    params?.supportedCurrencyIds?.includes(account.currency.id as CryptoCurrencyId) || false;

  useEffect(() => {
    if (value !== "" && value !== transaction.recipient) {
      onChangeTransaction(bridge.updateTransaction(transaction, { recipient: value }));
      resetInitValue && resetInitValue();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = useCallback(
    async (recipient: string, maybeExtra?: OnChangeExtra | null) => {
      const { currency } = maybeExtra || {};
      const invalidRecipient = currency && currency.scheme !== account.currency.scheme;
      setValue(recipient);
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          recipient: invalidRecipient ? "" : recipient,
        }),
      );
    },
    [account.currency.scheme, bridge, onChangeTransaction, transaction],
  );

  if (!status) return null;

  return isDomainResolutionEnabled && isCurrencySupported ? (
    <RecipientFieldDomainService
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

export default memo(RecipientField) as typeof RecipientField;
