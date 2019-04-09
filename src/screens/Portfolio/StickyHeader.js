// @flow

import React, { Component } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { Portfolio, Currency } from "@ledgerhq/live-common/lib/types";
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
  portfolio: Portfolio,
  counterValueCurrency: Currency,
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
      counterValueCurrency,
      portfolio,
      networkError,
      globalSyncState,
      isUpToDate,
      navigation,
    } = this.props;
    return (
      <AnimatedTopBar
        scrollY={scrollY}
        portfolio={portfolio}
        navigation={navigation}
        counterValueCurrency={counterValueCurrency}
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
