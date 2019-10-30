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
import ReceiveConfirmedIcon from "../icons/ReceiveConfirmed";
import ReceiveUnconfirmedIcon from "../icons/ReceiveUnconfirmed";
import SendConfirmedIcon from "../icons/SendConfirmed";
import SendUnconfirmedIcon from "../icons/SendUnconfirmed";
import SendFailed from "../icons/SendFailed";
import { currencySettingsForAccountSelector } from "../reducers/settings";

type Props = {
  type: OperationType,
  size: number,
  confirmed: boolean,
  operation: Operation,
  account: AccountLike,
  parentAccount: ?Account,
};

const icons = {
  OUT: [SendUnconfirmedIcon, SendConfirmedIcon, SendFailed],
  IN: [ReceiveUnconfirmedIcon, ReceiveConfirmedIcon],
  CREATE: [SendUnconfirmedIcon, SendConfirmedIcon, SendFailed],
  DELEGATE: [SendUnconfirmedIcon, SendConfirmedIcon, SendFailed],
  REVEAL: [SendUnconfirmedIcon, SendConfirmedIcon, SendFailed],
  NONE: [],
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
    const Icon = icons[type][hasFailed ? 2 : confirmed ? 1 : 0];

    if (!Icon) return null;

    return <Icon size={size} />;
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
