/* @flow */
import React, { Component } from "react";
import { TouchableWithoutFeedback, View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";
import LText from "../../components/LText";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import ParentCurrencyIcon from "../../components/ParentCurrencyIcon";

type Props = {
  navigation: NavigationScreenProp<*>,
  account: AccountLike,
};
const mapStateToProps = accountAndParentScreenSelector;

class AccountHeaderTitle extends Component<Props> {
  onPress = () => {
    // $FlowFixMe flowtyped not up to date
    this.props.navigation.emit("refocus");
  };

  render() {
    const { account } = this.props;
    if (!account) return null;
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <ParentCurrencyIcon
              size={18}
              currency={getAccountCurrency(account)}
            />
          </View>
          <LText
            semiBold
            secondary
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.title}
          >
            {getAccountName(account)}
          </LText>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

export default connect(mapStateToProps)(AccountHeaderTitle);

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    paddingVertical: 5,
  },
  iconContainer: {
    marginRight: 8,
    justifyContent: "center",
  },
});
