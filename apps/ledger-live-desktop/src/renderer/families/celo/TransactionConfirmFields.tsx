import React from "react";
import { Trans } from "react-i18next";
import { Transaction } from "@ledgerhq/live-common/families/celo/types";
import WarnBox from "~/renderer/components/WarnBox";

const Warning = ({
  transaction,
  recipientWording,
}: {
  transaction: Transaction;
  recipientWording: string;
}) => {
  switch (transaction.mode) {
    case "register":
    case "lock":
    case "unlock":
    case "withdraw":
    case "vote":
    case "activate":
    case "revoke":
      return null;
    default:
      return (
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
