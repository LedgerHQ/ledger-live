import { PendingOperation } from "@ledgerhq/live-common/errors";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type {
  Transaction,
  TransactionStatus,
  ZcashAccount,
} from "@ledgerhq/coin-zcash/types/bridge";
import { isConfirmedOperation } from "@ledgerhq/live-common/operation";
import { useFeature } from "@features/platform-feature-flags";
import React from "react";
import { connect } from "react-redux";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import TranslatedError from "~/renderer/components/TranslatedError";
import { State } from "~/renderer/reducers";
import { confirmationsNbForCurrencySelector } from "~/renderer/reducers/settings";
import ZcashSyncStateBanner from "./ZcashSyncStateBanner";
import ZcashMemoField from "./ZcashMemoField";

type Props = {
  account: ZcashAccount;
  confirmationsNb: number;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (transaction: Transaction) => void;
  autoFocus?: boolean;
};

const SendRecipientFields = (props: Props) => {
  const { confirmationsNb, account, transaction, status, onChange, autoFocus } = props;
  const shieldedEnabled = useFeature("zcashShielded")?.enabled ?? false;
  const pendingOperationError = new PendingOperation();
  const operations = account.pendingOperations.concat(account.operations);
  const incomingTransactionPending = operations.some(
    op => op.type === "IN" && !isConfirmedOperation(op, account, confirmationsNb),
  );
  // Memo can only be delivered to a shielded (private) recipient.
  const showMemo = shieldedEnabled && transaction.recipientType === "private";
  return (
    <>
      {incomingTransactionPending && (
        <Alert type={"warning"} mt={4}>
          <TranslatedError error={pendingOperationError} field="description" />
        </Alert>
      )}
      <ZcashSyncStateBanner account={account} sender={transaction.sender} />
      {showMemo ? (
        <Box mt={2}>
          <ZcashMemoField
            account={account}
            transaction={transaction}
            status={status}
            onChange={onChange}
            autoFocus={autoFocus}
          />
        </Box>
      ) : null}
    </>
  );
};

const m = connect(
  (
    state: State,
    props: {
      account: ZcashAccount;
      parentAccount: ZcashAccount | null | undefined;
      transaction: Transaction;
      status: TransactionStatus;
      onChange: (transaction: Transaction) => void;
      autoFocus?: boolean;
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
  fields: ["memo"],
};
