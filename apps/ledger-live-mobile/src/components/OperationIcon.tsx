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
import { UnionToIntersection } from "../types/helpers";
import { State } from "../reducers/types";

type OwnProps = {
  size: number;
  operation: Operation;
  account: AccountLike;
  parentAccount?: Account | null;
};
type Props = OwnProps & {
  type: OperationType;
  confirmed: boolean;
};

type FamilyOperationDetailsIntersection = UnionToIntersection<
  typeof perFamilyOperationDetails[keyof typeof perFamilyOperationDetails]
>;

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
      ? (perFamilyOperationDetails[
          mainAccount.currency.family as keyof typeof perFamilyOperationDetails
        ] as FamilyOperationDetailsIntersection)
      : null;
    const SpecificOperationStatusIcon =
      specific && specific.operationStatusIcon
        ? specific.operationStatusIcon[
            type as keyof typeof specific.operationStatusIcon
          ]
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

export default connect((state: State, props: OwnProps) => {
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
})(React.memo(OperationIcon));
