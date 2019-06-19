/* @flow */
import React, { Component } from "react";
import { TouchableWithoutFeedback, View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";
import LText from "../../components/LText";
import CurrencyIcon from "../../components/CurrencyIcon";
import { accountAndParentScreenSelector } from "../../reducers/accounts";

type Props = {
  navigation: NavigationScreenProp<*>,
  account: ?(Account | TokenAccount),
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
    const currency = getAccountCurrency(account);
    const name = account.type === "Account" ? account.name : currency.name;
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <CurrencyIcon size={18} currency={currency} />
          </View>
          <LText
            semiBold
            secondary
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.title}
          >
            {name}
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
    marginHorizontal: 24,
    paddingVertical: 5,
  },
  iconContainer: {
    marginRight: 8,
    justifyContent: "center",
  },
});
