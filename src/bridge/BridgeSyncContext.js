// @flow
// Unify the synchronization management for bridges with the redux store
// it handles automatically re-calling synchronize
// this is an even high abstraction than the bridge

import React, { Component } from "react";
import priorityQueue from "async/priorityQueue";
import { connect } from "react-redux";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { createStructuredSelector } from "reselect";
import { updateAccountWithUpdater } from "../actions/accounts";
import { setAccountSyncState } from "../actions/bridgeSync";
import {
  bridgeSyncSelector,
  syncStateLocalSelector,
} from "../reducers/bridgeSync";
import type { BridgeSyncState } from "../reducers/bridgeSync";
import { accountsSelector, isUpToDateSelector } from "../reducers/accounts";
import { SYNC_MAX_CONCURRENT } from "../constants";
import { getAccountBridge } from ".";

type BridgeSyncProviderProps = {
  children: *,
};

type BridgeSyncProviderOwnProps = BridgeSyncProviderProps & {
  bridgeSync: BridgeSyncState,
  accounts: Account[],
  isUpToDate: boolean,
  updateAccountWithUpdater: (string, (Account) => Account) => void,
  setAccountSyncState: (string, AsyncState) => *,
};

type AsyncState = {
  pending: boolean,
  error: ?Error,
};

export type BehaviorAction =
  | { type: "BACKGROUND_TICK" }
  | { type: "SET_SKIP_UNDER_PRIORITY", priority: number }
  | { type: "SYNC_ONE_ACCOUNT", accountId: string, priority: number }
  | { type: "SYNC_SOME_ACCOUNTS", accountIds: string[], priority: number }
  | { type: "SYNC_ALL_ACCOUNTS", priority: number };

export type Sync = (action: BehaviorAction) => void;

const BridgeSyncContext = React.createContext((_: BehaviorAction) => {});

const mapStateToProps = createStructuredSelector({
  accounts: accountsSelector,
  bridgeSync: bridgeSyncSelector,
  isUpToDate: isUpToDateSelector,
});

const actions = {
  updateAccountWithUpdater,
  setAccountSyncState,
};

class Provider extends Component<BridgeSyncProviderOwnProps, Sync> {
  constructor() {
    super();

    const synchronize = (accountId: string, next: () => void) => {
      const state = syncStateLocalSelector(this.props.bridgeSync, {
        accountId,
      });
      if (state.pending) {
        next();
        return;
      }
      const account = this.props.accounts.find(a => a.id === accountId);
      if (!account) {
        next();
        return;
      }

      const bridge = getAccountBridge(account);

      this.props.setAccountSyncState(accountId, { pending: true, error: null });

      // TODO migrate to the observation mode in future
      bridge.startSync(account, false).subscribe({
        next: accountUpdater => {
          this.props.updateAccountWithUpdater(accountId, accountUpdater);
        },
        complete: () => {
          this.props.setAccountSyncState(accountId, {
            pending: false,
            error: null,
          });
          next();
        },
        error: error => {
          this.props.setAccountSyncState(accountId, {
            pending: false,
            error,
          });
          next();
        },
      });
    };

    const syncQueue = priorityQueue(synchronize, SYNC_MAX_CONCURRENT);

    let skipUnderPriority: number = -1;

    const schedule = (_ids: string[], priority: number) => {
      if (priority < skipUnderPriority) return;
      const ids = _ids.slice(0);
      syncQueue.remove(o => {
        const i = ids.indexOf(o.data);
        if (i !== -1) {
          if (o.priority >= priority) {
            ids.splice(i, 1);
          } else {
            return true;
          }
        }
        return false;
      });
      syncQueue.push(ids, -priority);
    };

    // don't always sync in same order to avoid potential "never account never reached"
    const allAccountIds = () =>
      this.props.accounts
        .sort((a, b) => (a.lastSyncDate || 0) - (b.lastSyncDate || 0))
        .map(a => a.id);

    const handlers = {
      BACKGROUND_TICK: () => {
        if (syncQueue.idle()) {
          schedule(allAccountIds(), -1);
        }
      },

      SET_SKIP_UNDER_PRIORITY: ({ priority }) => {
        if (priority === skipUnderPriority) return;
        skipUnderPriority = priority;
        syncQueue.remove(({ priority }) => priority < skipUnderPriority);
        if (priority === -1 && !this.props.isUpToDate) {
          // going back to -1 priority => retriggering a background sync if it is "Paused"
          schedule(allAccountIds(), -1);
        }
      },

      SYNC_ALL_ACCOUNTS: ({ priority }) => {
        schedule(allAccountIds(), priority);
      },

      SYNC_ONE_ACCOUNT: ({ accountId, priority }) => {
        schedule([accountId], priority);
      },

      SYNC_SOME_ACCOUNTS: ({ accountIds, priority }) => {
        schedule(accountIds, priority);
      },
    };

    const sync = (action: BehaviorAction) => {
      const handler = handlers[action.type];
      if (handler) {
        // $FlowFixMe
        handler(action);
      } else {
        console.warn("BridgeSyncContext unsupported action", {
          action,
          type: "syncQueue",
        });
      }
    };

    this.api = sync;
  }

  api: Sync;

  render() {
    return (
      <BridgeSyncContext.Provider value={this.api}>
        {this.props.children}
      </BridgeSyncContext.Provider>
    );
  }
}

export const BridgeSyncProvider = connect(
  mapStateToProps,
  actions,
)(Provider);

export const BridgeSyncConsumer = BridgeSyncContext.Consumer;
