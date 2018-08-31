// @flow

// NB this component is likely for temporary usage

import React, { PureComponent } from "react";
import SyncIndicatorConnector from "./SyncIndicatorConnector";
import SyncIndicatorError from "./SyncIndicatorError";
import SyncIndicatorStatus from "./SyncIndicatorStatus";
import SyncIndicatorLoading from "./SyncIndicatorLoading";

type Props = {
  error: ?Error,
  isPending: boolean,
  isError: boolean,
  isUpToDate: boolean,
  cvPoll: *,
  setSyncBehavior: *,
};

class SyncIndicatorInner extends PureComponent<
  Props,
  { lastClickTime: number },
> {
  state = {
    lastClickTime: 0,
  };

  onPress = () => {
    this.props.cvPoll();
    this.props.setSyncBehavior({ type: "SYNC_ALL_ACCOUNTS", priority: 5 });
    this.setState({ lastClickTime: Date.now() });
  };

  render() {
    const { isUpToDate, isPending, isError, error } = this.props;
    const { lastClickTime } = this.state;
    const isUserClick = Date.now() - lastClickTime < 1000;
    const isLoading = isPending && (!isUpToDate || isUserClick);

    if (isError && error) {
      return <SyncIndicatorError error={error} onPress={this.onPress} />;
    }

    if (isLoading) {
      return <SyncIndicatorLoading />;
    }

    return (
      <SyncIndicatorStatus isUpToDate={isUpToDate} onPress={this.onPress} />
    );
  }
}

export default SyncIndicatorConnector(SyncIndicatorInner);
