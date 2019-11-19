/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
// $FlowFixMe
import { ScrollView } from "react-navigation";
import { translate } from "react-i18next";
import i18next from "i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import { accountScreenSelector } from "../../reducers/accounts";
import { deleteAccount } from "../../actions/accounts";
import BottomModal from "../../components/BottomModal";
import { TrackScreen } from "../../analytics";

import AccountNameRow from "./AccountNameRow";
import AccountUnitsRow from "./AccountUnitsRow";
import AccountCurrencyRow from "./AccountCurrencyRow";
import DeleteAccountRow from "./DeleteAccountRow";
import DeleteAccountModal from "./DeleteAccountModal";
import AccountAdvancedLogsRow from "./AccountAdvancedLogsRow";

type Props = {
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
  account: Account,
  deleteAccount: Function,
};

type State = {
  isModalOpened: boolean,
};
const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});
const mapDispatchToProps = {
  deleteAccount,
};
class AccountSettings extends PureComponent<Props, State> {
  static navigationOptions = {
    title: i18next.t("account.settings.header"),
  };

  state = {
    isModalOpened: false,
  };

  onRequestClose = () => {
    this.setState({ isModalOpened: false });
  };

  onPress = () => {
    this.setState({ isModalOpened: true });
  };

  deleteAccount = () => {
    const { account, deleteAccount, navigation } = this.props;
    deleteAccount(account);
    navigation.navigate("Accounts");
  };

  render() {
    const { navigation, account } = this.props;
    const { isModalOpened } = this.state;

    if (!account) return null;
    return (
      <ScrollView>
        <TrackScreen category="AccountSettings" />
        <View style={styles.sectionRow}>
          <AccountNameRow account={account} navigation={navigation} />
          <AccountUnitsRow account={account} navigation={navigation} />
          <AccountCurrencyRow
            currency={account.currency}
            navigation={navigation}
          />
          <AccountAdvancedLogsRow account={account} navigation={navigation} />
        </View>
        <View style={styles.sectionRow}>
          <DeleteAccountRow onPress={this.onPress} />
        </View>
        <BottomModal
          id="DeleteAccountModal"
          isOpened={isModalOpened}
          onClose={this.onRequestClose}
        >
          <DeleteAccountModal
            onRequestClose={this.onRequestClose}
            deleteAccount={this.deleteAccount}
            account={account}
          />
        </BottomModal>
      </ScrollView>
    );
  }
}

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(AccountSettings);

const styles = StyleSheet.create({
  sectionRow: {
    marginTop: 16,
  },
});
