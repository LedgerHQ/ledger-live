// @flow

import React, { Component } from "react";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { BridgeSyncConsumer } from "./BridgeSyncContext";
import type { Sync } from "./BridgeSyncContext";
import { accountsSelector } from "../reducers/accounts";

class SyncNewAccountsEffect extends Component<{
  sync: Sync,
  accounts: Account[],
  priority: number,
}> {
  componentDidUpdate(prevProps) {
    const prevAccountIds = prevProps.accounts.map(a => a.id);
    const newAccounts = this.props.accounts.filter(
      a => !prevAccountIds.includes(a.id),
    );
    if (newAccounts.length > 0) {
      const { sync, priority } = this.props;
      sync({
        type: "SYNC_SOME_ACCOUNTS",
        accountIds: newAccounts.map(a => a.id),
        priority,
      });
    }
  }

  render() {
    return null;
  }
}

const Effect = connect(
  createStructuredSelector({
    accounts: accountsSelector,
  }),
)(SyncNewAccountsEffect);

const SyncNewAccounts = ({ priority }: { priority: number }) => (
  <BridgeSyncConsumer>
    {sync => <Effect sync={sync} priority={priority} />}
  </BridgeSyncConsumer>
);

export default SyncNewAccounts;
