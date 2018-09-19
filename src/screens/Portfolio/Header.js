// @flow

import React, { Component, Fragment } from "react";
import colors from "../../colors";
import SyncIndicatorConnector from "../../components/SyncIndicatorConnector";
import StyledStatusBar from "../../components/StyledStatusBar";
import SyncErrorHeader from "../../components/SyncErrorHeader";
import AnimatedTopBar from "./AnimatedTopBar";
import { scrollToTopIntent } from "./events";

class Portfolio extends Component<{
  summary: *,
  scrollY: *,
  error: *,
}> {
  onPress = () => {
    scrollToTopIntent.next();
  };

  render() {
    const { scrollY, summary, error } = this.props;
    return (
      <Fragment>
        <StyledStatusBar
          backgroundColor={error ? colors.errorBg : colors.lightGrey}
        />
        {error ? (
          <SyncErrorHeader error={error} onPress={this.onPress} />
        ) : (
          <AnimatedTopBar scrollY={scrollY} summary={summary} />
        )}
      </Fragment>
    );
  }
}

export default SyncIndicatorConnector(Portfolio);
