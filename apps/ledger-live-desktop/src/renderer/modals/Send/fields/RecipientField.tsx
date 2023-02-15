import React, { useCallback, useEffect, useMemo, useState, memo } from "react";
import { RecipientRequired } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { TFunction } from "react-i18next";

import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import RecipientAddress from "~/renderer/components/RecipientAddress";
import { useNamingService } from "@ledgerhq/live-common/naming-service/index";

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
  console.log({account, transaction, onChangeTransaction, status, initValue});
  const bridge = getAccountBridge(account, null);
  const [value, setValue] = useState(initValue || "");
  const namingServiceResponse = useNamingService(value);
  const hasValidatedName = useMemo(() => namingServiceResponse.status === "loaded", [namingServiceResponse.status]);

  useEffect(() => {
    if (value && value !== transaction.recipient) {
      onChangeTransaction(bridge.updateTransaction(transaction, { recipient: value }));
      resetInitValue && resetInitValue();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = useCallback(
    async (recipient: string, maybeExtra?: Record<string, any>) => {
      const { currency } = maybeExtra || {}; // FIXME fromQRCode ?
      const invalidRecipient = currency && currency.scheme !== account.currency.scheme;
      setValue(recipient);
      onChangeTransaction(
        bridge.updateTransaction(transaction, { recipient: invalidRecipient ? "" : recipient, recipientName: undefined }),
      );
    },
    [bridge, account, transaction, onChangeTransaction],
  );

  useEffect(() => {
    if (hasValidatedName && value !== transaction.recipientName) {
      onChangeTransaction(bridge.updateTransaction(transaction, { recipient: (namingServiceResponse as { address: string }).address, recipientName: value }));
    }
  }, [bridge, transaction, onChangeTransaction, namingServiceResponse, hasValidatedName, value]);

  if (!status) return null;
  const { recipient: recipientError } = status.errors;
  const { recipient: recipientWarning } = status.warnings;

  return (
    <Box flow={1}>
      <Label>
        <span>{label || t("send.steps.details.recipientAddress")}</span>
      </Label>
      <RecipientAddress
        placeholder={t("RecipientField.placeholder", { currencyName: account.currency.name })}
        autoFocus={autoFocus}
        withQrCode={!status.recipientIsReadOnly}
        readOnly={status.recipientIsReadOnly}
        error={recipientError instanceof RecipientRequired ? null : recipientError}
        warning={recipientWarning}
        value={value}
        onChange={onChange}
        id={"send-recipient-input"}
      />
    </Box>
  );
};

export default memo(RecipientField);
