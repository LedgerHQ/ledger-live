/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import LText from "../../components/LText";
import CurrencyIcon from "../../components/CurrencyIcon";
import { accountScreenSelector } from "../../reducers/accounts";

type Props = {
  navigation: NavigationScreenProp<*>,
  account: Account,
};
const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});
class AccountHeaderTitle extends Component<Props> {
  render() {
    const { account } = this.props;
    return (
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <CurrencyIcon size={18} currency={account.currency} />
        </View>
        <LText semiBold secondary numberOfLines={1} ellipsizeMode="tail">
          {account.name}
        </LText>
      </View>
    );
  }
}

export default connect(mapStateToProps)(AccountHeaderTitle);

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    marginHorizontal: 24,
  },
  iconContainer: {
    marginRight: 8,
    justifyContent: "center",
  },
});
