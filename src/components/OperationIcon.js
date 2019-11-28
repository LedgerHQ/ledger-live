// @flow

import React, { PureComponent } from "react";
import { connect } from "react-redux";
import type {
  Account,
  Operation,
  OperationType,
  AccountLike,
} from "@ledgerhq/live-common/lib/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import OperationStatusIcon from "../icons/OperationStatusIcon";
import { currencySettingsForAccountSelector } from "../reducers/settings";

type Props = {
  type: OperationType,
  size: number,
  confirmed: boolean,
  operation: Operation,
  account: AccountLike,
  parentAccount: ?Account,
};

class OperationIcon extends PureComponent<Props> {
  static defaultProps = {
    confirmed: false,
  };

  render() {
    const {
      type,
      size,
      confirmed,
      operation: { hasFailed },
    } = this.props;

    return (
      <OperationStatusIcon
        confirmed={confirmed}
        type={type}
        failed={hasFailed}
        size={size}
      />
    );
  }
}

export default connect((state, props) => {
  const {
    account,
    parentAccount,
    operation: { blockHeight, type },
  } = props;
  const mainAccount = getMainAccount(account, parentAccount);
  const confirmations = blockHeight ? mainAccount.blockHeight - blockHeight : 0;
  return {
    type,
    confirmed:
      confirmations >=
      currencySettingsForAccountSelector(state, props).confirmationsNb,
  };
})(OperationIcon);
