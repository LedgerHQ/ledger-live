// @flow

import React, { Component, Fragment } from "react";
import SyncIndicatorConnector from "../../components/SyncIndicatorConnector";
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
