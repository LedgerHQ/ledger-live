// @flow
import React, { Component } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { AsyncState } from "../../reducers/bridgeSync";
import { globalSyncStateSelector } from "../../reducers/bridgeSync";
import { isUpToDateSelector } from "../../reducers/accounts";
import { networkErrorSelector } from "../../reducers/appstate";
import HeaderErrorTitle from "../../components/HeaderErrorTitle";
import HeaderSynchronizing from "../../components/HeaderSynchronizing";
import Greetings from "./Greetings";

const mapStateToProps = createStructuredSelector({
  networkError: networkErrorSelector,
  globalSyncState: globalSyncStateSelector,
  isUpToDate: isUpToDateSelector,
});

class PortfolioHeader extends Component<{
  nbAccounts: number,
  isUpToDate: boolean,
  globalSyncState: AsyncState,
  showGreeting: boolean,
  networkError: ?Error,
}> {
  render() {
    const {
      nbAccounts,
      isUpToDate,
      showGreeting,
      networkError,
      globalSyncState: { pending, error },
    } = this.props;
    return pending && !isUpToDate ? (
      <HeaderSynchronizing />
    ) : !isUpToDate && error ? (
      <HeaderErrorTitle
        withDescription
        withDetail
        error={networkError || error}
      />
    ) : showGreeting ? (
      <Greetings nbAccounts={nbAccounts} />
    ) : null;
  }
}

export default connect(mapStateToProps)(PortfolioHeader);
