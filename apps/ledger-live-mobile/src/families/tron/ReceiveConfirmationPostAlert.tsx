import type { Account } from "@ledgerhq/types-live";
import React from "react";
import { Trans } from "react-i18next";
import Alert from "~/components/Alert";
import { urls } from "~/utils/urls";

type Props = {
  mainAccount: Account;
};

export default function ReceiveConfirmationPostAlert({ mainAccount }: Props) {
  return (
    <>
      {mainAccount.operationsCount === 0 ? (
        <Alert
          type="warning"
          learnMoreUrl={urls.errors.TronSendTrc20ToNewAccountForbidden}
          testID="tron-receive-newAddress-warning"
        >
          <Trans i18nKey="tron.receive.newAddressTRC20" />
        </Alert>
      ) : null}
    </>
  );
}
