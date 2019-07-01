// @flow
import React, { Component } from "react";
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { withNavigation } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import type { AsyncState } from "../../reducers/bridgeSync";
import { globalSyncStateSelector } from "../../reducers/bridgeSync";
import { isUpToDateSelector } from "../../reducers/accounts";
import { networkErrorSelector } from "../../reducers/appstate";
import HeaderErrorTitle from "../../components/HeaderErrorTitle";
import HeaderSynchronizing from "../../components/HeaderSynchronizing";
import Greetings from "./Greetings";
import IconPie from "../../icons/Pie";
import colors from "../../colors";
import Touchable from "../../components/Touchable";

const mapStateToProps = createStructuredSelector({
  networkError: networkErrorSelector,
  globalSyncState: globalSyncStateSelector,
  isUpToDate: isUpToDateSelector,
});

class PortfolioHeader extends Component<{
  showDistribution?: boolean,
  nbAccounts: number,
  isUpToDate: boolean,
  globalSyncState: AsyncState,
  showGreeting: boolean,
  networkError: ?Error,
  navigation: { emit: (event: string) => void } & NavigationScreenProp<*>,
}> {
  onRefocus = () => {
    this.props.navigation.emit("refocus");
  };

  onDistributionButtonPress = () => {
    this.props.navigation.navigate("Distribution");
  };

  render() {
    const {
      nbAccounts,
      isUpToDate,
      showGreeting,
      networkError,
      globalSyncState: { pending, error },
      showDistribution,
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
        <View style={styles.wrapper}>
          <TouchableWithoutFeedback onPress={this.onRefocus}>
            <View style={styles.content}>{content}</View>
          </TouchableWithoutFeedback>
          {showDistribution && (
            <View style={styles.distributionButton}>
              <Touchable
                event="DistributionCTA"
                onPress={this.onDistributionButtonPress}
              >
                <IconPie size={16} color={colors.live} />
              </Touchable>
            </View>
          )}
        </View>
      );
    }
    return null;
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    paddingRight: 16,
  },
  content: {
    flexGrow: 1,
  },
  distributionButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignSelf: "center",
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
});

export default connect(mapStateToProps)(withNavigation(PortfolioHeader));
