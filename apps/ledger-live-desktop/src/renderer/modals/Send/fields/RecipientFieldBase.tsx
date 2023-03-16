import React, { memo } from "react";
import { RecipientRequired } from "@ledgerhq/errors";
import { Account } from "@ledgerhq/types-live";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { TFunction } from "react-i18next";

import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import RecipientAddress from "~/renderer/components/RecipientAddress";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

type Props = {
  account: Account;
  autoFocus?: boolean;
  status: TransactionStatus;
  t: TFunction;
  label?: React.ReactNode;
  initValue?: string;
  resetInitValue?: () => void;
  value: string | undefined;
  onChange: (recipient: string, maybeExtra?: Record<string, CryptoCurrency>) => Promise<void>;
};

const RecipientFieldBase = ({ t, account, autoFocus, status, label, value, onChange }: Props) => {
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

export default memo(RecipientFieldBase);
