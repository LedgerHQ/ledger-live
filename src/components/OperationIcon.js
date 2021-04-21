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

import perFamilyOperationDetails from "../generated/operationDetails";

type OwnProps = {
  size: number,
  operation: Operation,
  account: AccountLike,
  parentAccount: ?Account,
};

type Props = OwnProps & {
  type: OperationType,
  confirmed: boolean,
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
      operation,
      account,
      parentAccount,
    } = this.props;

    const mainAccount = getMainAccount(account, parentAccount);

    const specific = mainAccount.currency.family
      ? perFamilyOperationDetails[mainAccount.currency.family]
      : null;

    const SpecificOperationStatusIcon =
      specific && specific.operationStatusIcon
        ? specific.operationStatusIcon[type]
        : null;

    return SpecificOperationStatusIcon ? (
      <SpecificOperationStatusIcon
        operation={operation}
        confirmed={confirmed}
        type={type}
        failed={hasFailed}
        size={size}
      />
    ) : (
      <OperationStatusIcon
        confirmed={confirmed}
        type={type}
        failed={hasFailed}
        size={size}
      />
    );
  }
}

const m: React$ComponentType<OwnProps> = connect((state, props) => {
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

export default m;
