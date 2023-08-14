import React from "react";
import { Trans } from "react-i18next";
import { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import WarnBox from "~/renderer/components/WarnBox";

const Warning = ({
  transaction,
  recipientWording,
}: {
  transaction: Transaction;
  recipientWording: string;
}) => {
  switch (transaction.mode) {
    case "erc20.approve":
      return (
        <WarnBox>
          <Trans i18nKey="TransactionConfirm.secureContract" />
        </WarnBox>
      );
    default:
      return transaction.data ? (
        <WarnBox>
          <Trans i18nKey="TransactionConfirm.verifyData" />
        </WarnBox>
      ) : (
        <WarnBox>
          <Trans
            i18nKey="TransactionConfirm.warning"
            values={{
              recipientWording,
            }}
          />
        </WarnBox>
      );
  }
};
export default {
  warning: Warning,
};
