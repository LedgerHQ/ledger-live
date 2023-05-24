import React, { memo } from "react";
import { RecipientRequired } from "@ledgerhq/errors";
import { Account } from "@ledgerhq/types-live";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { TFunction } from "react-i18next";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import RecipientAddress, { OnChangeExtra } from "~/renderer/components/RecipientAddress";

type Props = {
  account: Account;
  autoFocus?: boolean;
  status: TransactionStatus;
  t: TFunction;
  label?: React.ReactNode;
  initValue?: string;
  resetInitValue?: () => void;
  value: string | undefined;
  placeholderTranslationKey: string;
  hideError: boolean;
  onChange: (recipient: string, maybeExtra?: OnChangeExtra | undefined) => void;
};

const RecipientFieldBase = ({
  t,
  account,
  autoFocus,
  status,
  label,
  value,
  onChange,
  placeholderTranslationKey,
  hideError,
}: Props) => {
  const { recipient: recipientError } = status.errors;
  const { recipient: recipientWarning } = status.warnings;

  return (
    <Box flow={1}>
      <Label>
        <span>{label || t("send.steps.details.recipientAddress")}</span>
      </Label>
      <RecipientAddress
        placeholder={t(placeholderTranslationKey, { currencyName: account.currency.name })}
        autoFocus={autoFocus}
        withQrCode={!status.recipientIsReadOnly}
        readOnly={status.recipientIsReadOnly}
        error={hideError || recipientError instanceof RecipientRequired ? null : recipientError}
        warning={recipientWarning}
        value={value}
        onChange={onChange}
        id={"send-recipient-input"}
      />
    </Box>
  );
};

RecipientFieldBase.defaultProps = {
  placeholderTranslationKey: "RecipientField.placeholder",
  hideError: false,
};

export default memo(RecipientFieldBase);
