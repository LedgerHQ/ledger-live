import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Account } from "@ledgerhq/types-live";
import type { TFunction } from "i18next";

import RecipientFieldBase from "./RecipientFieldBase";
import RecipientFieldDomainService from "./RecipientFieldDomainService";
import { useFeature } from "@features/platform-feature-flags";
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
  const bridge = useAccountBridge<T>(account, null);
  const [value, setValue] = useState(
    initValue || transaction?.recipientDomain?.domain || transaction.recipient || "",
  );

  const { enabled: isDomainResolutionEnabled, params } = useFeature("domainInputResolution") || {};
  const isCurrencySupported = params?.supportedCurrencyIds?.includes(account.currency.id) || false;

  const wasReadOnly = useRef(false);

  // Follow the transaction when the recipient is driven externally (the field
  // is locked). Also runs once on the unlock transition so clearing the
  // recipient clears the input. Inert wherever recipientIsReadOnly is never
  // true -- i.e. every currency today -- so typing and bc1... lowercasing in
  // coin-bitcoin's updateTransaction are untouched.
  useEffect(() => {
    const isReadOnly = Boolean(status?.recipientIsReadOnly);
    if (isReadOnly || wasReadOnly.current) {
      const next = transaction.recipient || "";
      if (next !== value) setValue(next);
    }
    wasReadOnly.current = isReadOnly;
  }, [status?.recipientIsReadOnly, transaction.recipient, value]);

  useEffect(() => {
    if (value !== "" && value !== transaction.recipient) {
      onChangeTransaction(
        bridge.updateTransaction(transaction, { recipient: value } as Partial<T>),
      );
      resetInitValue?.();
    }
  }, [account]); // oxlint-disable-line react-hooks/exhaustive-deps

  const onChange = useCallback(
    async (recipient: string, maybeExtra?: OnChangeExtra | null) => {
      const { currency } = maybeExtra || {};
      const invalidRecipient = currency && currency.scheme !== account.currency.scheme;
      setValue(recipient);
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          recipient: invalidRecipient ? "" : recipient,
        } as Partial<T>),
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
