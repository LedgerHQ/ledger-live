import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { isConfirmedOperation } from "@ledgerhq/live-common/operation";
import Alert from "~/renderer/components/Alert";
import TranslatedError from "~/renderer/components/TranslatedError";
import { confirmationsNbForCurrencySelector } from "../../reducers/settings";
import { withTranslation } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { PendingOperation } from "@ledgerhq/errors";

class SendRecipientFields extends PureComponent {
  render() {
    const { confirmationsNb, account } = this.props;
    const pendingOperationError = new PendingOperation();
    const atleastOneOperationPending = !account.pendingOperations
      .concat(account.operations)
      .every(op => isConfirmedOperation(op, account, confirmationsNb));
    return (
      <div>
        {atleastOneOperationPending && (
          <Alert type={"warning"} mt={4}>
            <TranslatedError error={pendingOperationError} field="description" />
          </Alert>
        )}
      </div>
    );
  }
}

const m = connect((state, props) => {
  const currencySettings = confirmationsNbForCurrencySelector(state, {
    currency: getMainAccount(props.account, props.parentAccount).currency,
  });
  const confirmationsNb = currencySettings.confirmationsNb;
  return {
    ...props,
    confirmationsNb,
  };
})(SendRecipientFields);
export default {
  component: withTranslation()(m),
};
