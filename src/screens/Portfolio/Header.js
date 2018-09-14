// @flow

import React, { Component, Fragment } from "react";
import colors from "../../colors";
import SyncIndicatorConnector from "../../components/SyncIndicatorConnector";
import StyledStatusBar from "../../components/StyledStatusBar";
import AnimatedTopBar from "./AnimatedTopBar";
import SyncErrorHeader from "./SyncErrorHeader";

class Portfolio extends Component<{
  summary: *,
  scrollY: *,
  error: *,
}> {
  render() {
    const { scrollY, summary, error } = this.props;
    return (
      <Fragment>
        <StyledStatusBar backgroundColor={colors.lightGrey} />
        {error ? (
          <SyncErrorHeader error={error} />
        ) : (
          <AnimatedTopBar scrollY={scrollY} summary={summary} />
        )}
      </Fragment>
    );
  }
}

export default SyncIndicatorConnector(Portfolio);
