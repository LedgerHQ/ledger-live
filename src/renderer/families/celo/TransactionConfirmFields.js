// @flow

import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";

import type { Transaction } from "@ledgerhq/live-common/lib/types";

import WarnBox from "~/renderer/components/WarnBox";

const Warning = ({
  transaction,
  recipientWording,
}: {
  transaction: Transaction,
  recipientWording: string,
}) => {
  invariant(transaction.family === "celo", "celo transaction");

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
          <Trans i18nKey="TransactionConfirm.warning" values={{ recipientWording }} />
        </WarnBox>
      );
  }
};

export default {
  warning: Warning,
};
