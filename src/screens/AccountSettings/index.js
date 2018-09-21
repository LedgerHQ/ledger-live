/* @flow */
import React, { PureComponent, Fragment } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import i18next from "i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import { accountScreenSelector } from "../../reducers/accounts";
import { deleteAccount } from "../../actions/accounts";
import HeaderRightClose from "../../components/HeaderRightClose";
import BottomModal from "../../components/BottomModal";

import AccountNameRow from "./AccountNameRow";
import AccountUnitsRow from "./AccountUnitsRow";
import ArchiveAccountRow from "./ArchiveAccountRow";
import DeleteAccountRow from "./DeleteAccountRow";
import DeleteAccountModal from "./DeleteAccountModal";

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
  static navigationOptions = ({ navigation }: *) => ({
    title: i18next.t("account.settings.header"),
    headerRight: (
      <HeaderRightClose navigation={navigation.dangerouslyGetParent()} />
    ),
    headerLeft: null,
  });

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
      <Fragment>
        <View style={styles.sectionRow}>
          <AccountNameRow account={account} navigation={navigation} />
          <AccountUnitsRow account={account} navigation={navigation} />
        </View>
        <View style={styles.sectionRow}>
          <ArchiveAccountRow />
          <DeleteAccountRow onPress={this.onPress} />
        </View>
        <BottomModal isOpened={isModalOpened} onClose={this.onRequestClose}>
          <DeleteAccountModal
            onRequestClose={this.onRequestClose}
            deleteAccount={this.deleteAccount}
            account={account}
          />
        </BottomModal>
      </Fragment>
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
