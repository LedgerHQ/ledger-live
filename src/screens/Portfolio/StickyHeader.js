// @flow

import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import colors from "../../colors";
import StyledStatusBar from "../../components/StyledStatusBar";
import AnimatedTopBar from "./AnimatedTopBar";
import { scrollToTopIntent } from "./events";
import { globalSyncStateSelector } from "../../reducers/bridgeSync";
import type { AsyncState } from "../../reducers/bridgeSync";

const mapStateToProps = createStructuredSelector({
  globalSyncState: globalSyncStateSelector,
});

class Portfolio extends Component<{
  summary: *,
  scrollY: *,
  globalSyncState: AsyncState,
}> {
  onPress = () => {
    scrollToTopIntent.next();
  };

  render() {
    const { scrollY, summary, globalSyncState } = this.props;
    return (
      <Fragment>
        <StyledStatusBar backgroundColor={colors.lightGrey} />
        <AnimatedTopBar
          scrollY={scrollY}
          summary={summary}
          pending={globalSyncState.pending}
          error={globalSyncState.error}
        />
      </Fragment>
    );
  }
}

export default connect(mapStateToProps)(Portfolio);
