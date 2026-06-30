import { PendingOperation } from "@ledgerhq/errors";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { BitcoinAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/bitcoin/types";
import { isConfirmedOperation } from "@ledgerhq/live-common/operation";
import { useFeature } from "@features/platform-feature-flags";
import React from "react";
import { connect } from "react-redux";
import Alert from "~/renderer/components/Alert";
import TranslatedError from "~/renderer/components/TranslatedError";
import { State } from "~/renderer/reducers";
import { confirmationsNbForCurrencySelector } from "~/renderer/reducers/settings";

// FIXME: ConfirmationNB seems to be specific.
// So we can't do
// type Props = NonNullable<BitcoinFamily["sendRecipientFields"]>["component"]
type Props = {
  account: BitcoinAccount;
  confirmationsNb: number;
  transaction?: Transaction;
  status?: TransactionStatus;
};

const SendRecipientFields = (props: Props) => {
  const { confirmationsNb, account, status } = props;
  const pendingOperationError = new PendingOperation();
  const operations = account.pendingOperations.concat(account.operations);
  const incomingTransactionPending = operations.some(
    op => op.type === "IN" && !isConfirmedOperation(op, account, confirmationsNb),
  );

  const zcashShielded = useFeature("zcashShielded");
  const isZcash = account.currency.id === "zcash" && zcashShielded?.enabled;

  return (
    <>
      {incomingTransactionPending ? (
        <Alert type={"warning"} mt={4}>
          <TranslatedError error={pendingOperationError} field="description" />
        </Alert>
      ) : null}
      {isZcash && status?.errors?.recipient ? (
        <Alert type={"warning"} mt={4}>
          <TranslatedError error={status.errors.recipient} field="title" />
        </Alert>
      ) : null}
    </>
  );
};

const m = connect(
  (
    state: State,
    props: { account: BitcoinAccount; parentAccount: BitcoinAccount | null | undefined },
  ) => {
    const confirmationsNb = confirmationsNbForCurrencySelector(state, {
      currency: getMainAccount(props.account, props.parentAccount).currency,
    });
    return {
      ...props,
      confirmationsNb,
    };
  },
)(SendRecipientFields);
export default {
  component: m,
};
