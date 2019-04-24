// @flow

import React, { PureComponent } from "react";
import type { Operation, OperationType } from "@ledgerhq/live-common/lib/types";

import { connect } from "react-redux";

import ReceiveConfirmedIcon from "../icons/ReceiveConfirmed";
import ReceiveUnconfirmedIcon from "../icons/ReceiveUnconfirmed";
import SendConfirmedIcon from "../icons/SendConfirmed";
import SendUnconfirmedIcon from "../icons/SendUnconfirmed";
import { currencySettingsForAccountSelector } from "../reducers/settings";

type Props = {
  type: OperationType,
  size: number,
  confirmed: boolean,
  operation: Operation,
};

class OperationIcon extends PureComponent<Props> {
  static defaultProps = {
    confirmed: false,
  };

  icons = {
    OUT: [SendUnconfirmedIcon, SendConfirmedIcon],
    IN: [ReceiveUnconfirmedIcon, ReceiveConfirmedIcon],
  };

  render() {
    const { type, size, confirmed } = this.props;
    const Icon = this.icons[type][confirmed ? 1 : 0];

    return <Icon size={size} />;
  }
}

export default connect((state, props) => {
  const {
    account,
    operation: { blockHeight, type },
  } = props;
  const confirmations = blockHeight ? account.blockHeight - blockHeight : 0;

  return {
    type,
    confirmed:
      confirmations >=
      currencySettingsForAccountSelector(state, props).confirmationsNb,
  };
})(OperationIcon);
