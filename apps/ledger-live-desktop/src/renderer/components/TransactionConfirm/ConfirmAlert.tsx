import React, { useMemo } from "react";
import { TFunction } from "i18next";
import { Trans, withTranslation } from "react-i18next";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import Alert from "~/renderer/components/Alert";

type Props = {
  t: TFunction;
  transaction: Transaction;
  typeTransaction: string | undefined;
  fields: DeviceTransactionField[];
};

const ConfirmAlert = ({ t, transaction, typeTransaction, fields }: Props) => {
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

  // TODO: if confirmed by PO, remove also apps/ledger-live-desktop/src/renderer/families/evm/TransactionConfirmFields.tsx
  // if (Warning) {
  //   return (
  //     <Warning
  //       account={account}
  //       parentAccount={parentAccount}
  //       transaction={transaction}
  //       recipientWording={recipientWording}
  //       status={status}
  //     />
  //   );
  // }
  let alertContentKey = "TransactionConfirm.doubleCheck";
  if (typeTransaction === "Approve") {
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
