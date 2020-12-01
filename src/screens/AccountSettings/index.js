/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { connect } from "react-redux";
import { ScreenName } from "../../const";
import { accountScreenSelector } from "../../reducers/accounts";
import { deleteAccount } from "../../actions/accounts";
import BottomModal from "../../components/BottomModal";
import NavigationScrollView from "../../components/NavigationScrollView";
import { TrackScreen } from "../../analytics";

import AccountNameRow from "./AccountNameRow";
import AccountUnitsRow from "./AccountUnitsRow";
import AccountCurrencyRow from "./AccountCurrencyRow";
import DeleteAccountRow from "./DeleteAccountRow";
import DeleteAccountModal from "./DeleteAccountModal";
import AccountAdvancedLogsRow from "./AccountAdvancedLogsRow";

type Props = {
  navigation: any,
  route: { params: RouteParams },
  account: Account,
  deleteAccount: Function,
};

type RouteParams = {
  accountId: string,
};

type State = {
  isModalOpened: boolean,
};

const mapStateToProps = (state, { route }) =>
  accountScreenSelector(route)(state);

const mapDispatchToProps = {
  deleteAccount,
};

class AccountSettings extends PureComponent<Props, State> {
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
    navigation.navigate(ScreenName.Accounts);
  };

  render() {
    const { navigation, account } = this.props;
    const { isModalOpened } = this.state;

    if (!account) return null;
    return (
      <NavigationScrollView>
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
      </NavigationScrollView>
    );
  }
}

// $FlowFixMe
export default connect(mapStateToProps, mapDispatchToProps)(AccountSettings);

const styles = StyleSheet.create({
  sectionRow: {
    marginTop: 16,
  },
});
