// @flow
import React, { Component } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { AsyncState } from "../../reducers/bridgeSync";
import { globalSyncStateSelector } from "../../reducers/bridgeSync";
import HeaderErrorTitle from "../../components/HeaderErrorTitle";
import HeaderSynchronizing from "../../components/HeaderSynchronizing";
import Greetings from "./Greetings";

const mapStateToProps = createStructuredSelector({
  globalSyncState: globalSyncStateSelector,
});

class PortfolioHeader extends Component<{
  nbAccounts: number,
  globalSyncState: AsyncState,
}> {
  render() {
    const {
      nbAccounts,
      globalSyncState: { pending, error },
    } = this.props;
    return pending ? (
      <HeaderSynchronizing />
    ) : error ? (
      <HeaderErrorTitle withDescription withDetail error={error} />
    ) : (
      <Greetings nbAccounts={nbAccounts} />
    );
  }
}

export default connect(mapStateToProps)(PortfolioHeader);
