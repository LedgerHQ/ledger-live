import React, { useMemo } from "react";
import { TFunction } from "i18next";
import { Trans, withTranslation } from "react-i18next";
import {
  Account,
  AccountLike,
  SubAccount,
  TransactionCommon,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import Alert from "~/renderer/components/Alert";

type Props = {
  t: TFunction;
  Warning:
    | React.ComponentType<{
        account: Account | SubAccount;
        parentAccount: Account | null | undefined;
        transaction: TransactionCommon;
        status: TransactionStatusCommon;
        recipientWording: string;
      }>
    | undefined;
  account: AccountLike;
  parentAccount: Account | undefined | null;
  transaction: Transaction;
  status: TransactionStatus;
  typeTransaction: string | undefined;
  fields: DeviceTransactionField[];
};

const ConfirmAlert = ({
  t,
  Warning,
  account,
  parentAccount,
  transaction,
  status,
  typeTransaction,
  fields,
}: Props) => {
  const key = ("mode" in transaction && transaction.mode) || "send";
  const recipientWording = t(`TransactionConfirm.recipientWording.${key}`);

  const amountTransaction: string = useMemo(
    () =>
      (
        fields.find(
          (field: { label: string }) => field.label && field.label === "Amount",
        ) as DeviceTransactionField & { value: string }
      )?.value || "",
    [fields],
  );

  if (Warning) {
    return (
      <Warning
        account={account}
        parentAccount={parentAccount}
        transaction={transaction}
        recipientWording={recipientWording}
        status={status}
      />
    );
  }
  let alertContentKey = "TransactionConfirm.warning";
  if (typeTransaction === "Approval") {
    alertContentKey = amountTransaction.includes("Unlimited")
      ? "approve.unlimited"
      : "approve.limited";
  }
  return (
    <Alert type="primary" mb={26}>
      <Trans
        i18nKey={alertContentKey}
        values={{
          recipientWording,
        }}
      />
    </Alert>
  );
};

export default withTranslation()(ConfirmAlert);
