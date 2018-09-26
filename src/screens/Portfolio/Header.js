// @flow
import React, { Component } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { AsyncState } from "../../reducers/bridgeSync";
import { globalSyncStateSelector } from "../../reducers/bridgeSync";
import { isUpToDateSelector } from "../../reducers/accounts";
import HeaderErrorTitle from "../../components/HeaderErrorTitle";
import HeaderSynchronizing from "../../components/HeaderSynchronizing";
import Greetings from "./Greetings";

const mapStateToProps = createStructuredSelector({
  globalSyncState: globalSyncStateSelector,
  isUpToDate: isUpToDateSelector,
});

class PortfolioHeader extends Component<{
  nbAccounts: number,
  isUpToDate: boolean,
  globalSyncState: AsyncState,
}> {
  render() {
    const {
      nbAccounts,
      isUpToDate,
      globalSyncState: { pending, error },
    } = this.props;
    return pending && !isUpToDate ? (
      <HeaderSynchronizing />
    ) : !isUpToDate && error ? (
      <HeaderErrorTitle withDescription withDetail error={error} />
    ) : (
      <Greetings nbAccounts={nbAccounts} />
    );
  }
}

export default connect(mapStateToProps)(PortfolioHeader);
