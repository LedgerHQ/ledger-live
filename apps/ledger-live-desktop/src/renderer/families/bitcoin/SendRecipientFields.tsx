import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { isConfirmedOperation } from "@ledgerhq/live-common/operation";
import Alert from "~/renderer/components/Alert";
import TranslatedError from "~/renderer/components/TranslatedError";
import { confirmationsNbForCurrencySelector } from "../../reducers/settings";
import { withTranslation } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { PendingOperation } from "@ledgerhq/errors";
import { Account } from "@ledgerhq/types-live";
type Props = {
  account: Account;
  confirmationsNb: number;
};
class SendRecipientFields extends PureComponent<Props> {
  render() {
    const { confirmationsNb, account } = this.props;
    const pendingOperationError = new PendingOperation();
    const operations = account.pendingOperations.concat(account.operations);
    const incomingTransactionPending = operations.some(
      op => op.type === "IN" && !isConfirmedOperation(op, account, confirmationsNb),
    );
    return incomingTransactionPending ? (
      <Alert type={"warning"} mt={4}>
        <TranslatedError error={pendingOperationError} field="description" />
      </Alert>
    ) : null;
  }
}
const m = connect((state, props) => {
  const confirmationsNb = confirmationsNbForCurrencySelector(state, {
    currency: getMainAccount(props.account, props.parentAccount).currency,
  });
  return {
    ...props,
    confirmationsNb,
  };
})(SendRecipientFields);
export default {
  component: withTranslation()(m),
};
