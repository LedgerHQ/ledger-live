import { Transaction } from "@ledgerhq/coin-evm/types/index";
import React from "react";
import { Trans } from "react-i18next";
import WarnBox from "~/renderer/components/WarnBox";

const Warning = ({
  transaction,
  recipientWording,
}: {
  transaction: Transaction;
  recipientWording: string;
}) => {
  switch (transaction.mode) {
    case "send":
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
