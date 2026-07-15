import { PendingOperation } from "@ledgerhq/errors";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import {
  BitcoinAccount,
  Transaction,
  ZcashAccount,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { isConfirmedOperation } from "@ledgerhq/live-common/operation";
import type { ZcashTransaction } from "@ledgerhq/coin-bitcoin/chain-adapters/zcash/types";
import React from "react";
import { connect } from "react-redux";
import Alert from "~/renderer/components/Alert";
import TranslatedError from "~/renderer/components/TranslatedError";
import { State } from "~/renderer/reducers";
import { confirmationsNbForCurrencySelector } from "~/renderer/reducers/settings";
import ZcashSyncStateBanner from "./ZcashSyncStateBanner";

// FIXME: ConfirmationNB seems to be specific.
// So we can't do
// type Props = NonNullable<BitcoinFamily["sendRecipientFields"]>["component"]
type Props = {
  account: BitcoinAccount;
  confirmationsNb: number;
  transaction: Transaction;
};

const SendRecipientFields = (props: Props) => {
  const { confirmationsNb, account, transaction } = props;
  const pendingOperationError = new PendingOperation();
  const operations = account.pendingOperations.concat(account.operations);
  const incomingTransactionPending = operations.some(
    op => op.type === "IN" && !isConfirmedOperation(op, account, confirmationsNb),
  );
  return (
    <>
      {incomingTransactionPending && (
        <Alert type={"warning"} mt={4}>
          <TranslatedError error={pendingOperationError} field="description" />
        </Alert>
      )}
      {account.currency.id === "zcash" ? (
        <ZcashSyncStateBanner
          account={account as ZcashAccount}
          sender={(transaction as Partial<ZcashTransaction>).sender}
        />
      ) : null}
    </>
  );
};

const m = connect(
  (
    state: State,
    props: {
      account: BitcoinAccount;
      parentAccount: BitcoinAccount | null | undefined;
      transaction: Transaction;
    },
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
