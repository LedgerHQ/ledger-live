// @flow

import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import colors from "../../colors";
import StyledStatusBar from "../../components/StyledStatusBar";
import AnimatedTopBar from "./AnimatedTopBar";
import { scrollToTopIntent } from "./events";
import { isUpToDateSelector } from "../../reducers/accounts";
import { globalSyncStateSelector } from "../../reducers/bridgeSync";
import type { AsyncState } from "../../reducers/bridgeSync";

const mapStateToProps = createStructuredSelector({
  globalSyncState: globalSyncStateSelector,
  isUpToDate: isUpToDateSelector,
});

class Portfolio extends Component<{
  summary: *,
  scrollY: *,
  isUpToDate: boolean,
  globalSyncState: AsyncState,
}> {
  onPress = () => {
    scrollToTopIntent.next();
  };

  render() {
    const { scrollY, summary, globalSyncState, isUpToDate } = this.props;
    return (
      <Fragment>
        <StyledStatusBar backgroundColor={colors.lightGrey} />
        <AnimatedTopBar
          scrollY={scrollY}
          summary={summary}
          pending={globalSyncState.pending && !isUpToDate}
          error={isUpToDate ? null : globalSyncState.error}
        />
      </Fragment>
    );
  }
}

export default connect(mapStateToProps)(Portfolio);
