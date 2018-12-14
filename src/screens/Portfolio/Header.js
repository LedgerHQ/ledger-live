// @flow
import React, { Component } from "react";
import { TouchableWithoutFeedback } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { AsyncState } from "../../reducers/bridgeSync";
import { globalSyncStateSelector } from "../../reducers/bridgeSync";
import { isUpToDateSelector } from "../../reducers/accounts";
import { networkErrorSelector } from "../../reducers/appstate";
import HeaderErrorTitle from "../../components/HeaderErrorTitle";
import HeaderSynchronizing from "../../components/HeaderSynchronizing";
import Greetings from "./Greetings";

const mapStateToProps = createStructuredSelector({
  networkError: networkErrorSelector,
  globalSyncState: globalSyncStateSelector,
  isUpToDate: isUpToDateSelector,
});

class PortfolioHeader extends Component<{
  nbAccounts: number,
  isUpToDate: boolean,
  globalSyncState: AsyncState,
  showGreeting: boolean,
  networkError: ?Error,
  navigation: { emit: (event: string) => void } & NavigationScreenProp<*>,
}> {
  onPress = () => {
    this.props.navigation.emit("refocus");
  };

  render() {
    const {
      nbAccounts,
      isUpToDate,
      showGreeting,
      networkError,
      globalSyncState: { pending, error },
    } = this.props;

    const content =
      pending && !isUpToDate ? (
        <HeaderSynchronizing />
      ) : error ? (
        <HeaderErrorTitle
          withDescription
          withDetail
          error={networkError || error}
        />
      ) : showGreeting ? (
        <Greetings nbAccounts={nbAccounts} />
      ) : null;

    if (content) {
      return (
        <TouchableWithoutFeedback onPress={this.onPress}>
          {content}
        </TouchableWithoutFeedback>
      );
    }
    return null;
  }
}

export default connect(mapStateToProps)(PortfolioHeader);
