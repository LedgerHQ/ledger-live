// @flow

import React, { Component } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import AnimatedTopBar from "./AnimatedTopBar";
import { isUpToDateSelector } from "../../reducers/accounts";
import { globalSyncStateSelector } from "../../reducers/bridgeSync";
import { networkErrorSelector } from "../../reducers/appstate";
import type { AsyncState } from "../../reducers/bridgeSync";

const mapStateToProps = createStructuredSelector({
  networkError: networkErrorSelector,
  globalSyncState: globalSyncStateSelector,
  isUpToDate: isUpToDateSelector,
});

class StickyHeader extends Component<{
  summary: *,
  scrollY: *,
  isUpToDate: boolean,
  globalSyncState: AsyncState,
  networkError: ?Error,
  navigation: *,
}> {
  onPress = () => {
    this.props.navigation.emit("refocus");
  };

  render() {
    const {
      scrollY,
      summary,
      networkError,
      globalSyncState,
      isUpToDate,
      navigation,
    } = this.props;
    return (
      <AnimatedTopBar
        scrollY={scrollY}
        summary={summary}
        navigation={navigation}
        pending={globalSyncState.pending && !isUpToDate}
        error={
          isUpToDate || !globalSyncState.error
            ? null
            : networkError || globalSyncState.error
        }
      />
    );
  }
}

export default connect(mapStateToProps)(StickyHeader);
