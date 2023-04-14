import type { Account } from "@ledgerhq/types-live";
import React from "react";
import { Trans } from "react-i18next";
import Alert from "../../components/Alert";

type Props = {
  mainAccount: Account;
};

export default function ReceiveConfirmationAlertPost({ mainAccount }: Props) {
  return (
    <>
      {mainAccount.currency.id === "dash" ? (
        <Alert type="warning">
          <Trans i18nKey="transfer.receive.receiveConfirmation.dashStakingWarning" />
        </Alert>
      ) : null}
    </>
  );
}
