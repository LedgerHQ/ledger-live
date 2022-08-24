import React, { PureComponent } from "react";
import { connect } from "react-redux";
import type {
  Account,
  Operation,
  OperationType,
  AccountLike,
} from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { isConfirmedOperation } from "@ledgerhq/live-common/operation";
import OperationStatusIcon from "../icons/OperationStatusIcon";
import { currencySettingsForAccountSelector } from "../reducers/settings";
import perFamilyOperationDetails from "../generated/operationDetails";

type OwnProps = {
  size: number;
  operation: Operation;
  account: AccountLike;
  parentAccount: Account | null | undefined;
};
type Props = OwnProps & {
  type: OperationType;
  confirmed: boolean;
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

const m: React.ComponentType<OwnProps> = connect((state, props) => {
  const { account, parentAccount, operation } = props;
  const { type } = operation;
  const mainAccount = getMainAccount(account, parentAccount);
  const currencySettings = currencySettingsForAccountSelector(state, props);
  const isConfirmed = isConfirmedOperation(
    operation,
    mainAccount,
    currencySettings.confirmationsNb,
  );
  return {
    type,
    confirmed: isConfirmed,
  };
})(OperationIcon);
export default m;
