import React, { PureComponent } from "react";
import { Account } from "@ledgerhq/live-common/types/index";
import { connect } from "react-redux";
import { accountScreenSelector } from "../../reducers/accounts";
import { deleteAccount } from "../../actions/accounts";
import { TrackScreen } from "../../analytics";
import { NavigatorName } from "../../const";

import AccountNameRow from "./AccountNameRow";
import AccountUnitsRow from "./AccountUnitsRow";
import AccountCurrencyRow from "./AccountCurrencyRow";
import DeleteAccountRow from "./DeleteAccountRow";
import DeleteAccountModal from "./DeleteAccountModal";
import AccountAdvancedLogsRow from "./AccountAdvancedLogsRow";
import SettingsNavigationScrollView from "../Settings/SettingsNavigationScrollView";

type Props = {
  navigation: any;
  route: { params: RouteParams };
  account: Account;
  deleteAccount: Function;
};

type RouteParams = {
  accountId: string;
};

type State = {
  isModalOpened: boolean;
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
    navigation.replace(NavigatorName.PortfolioAccounts);
  };

  render() {
    const { navigation, account } = this.props;
    const { isModalOpened } = this.state;

    if (!account) return null;
    return (
      <SettingsNavigationScrollView>
        <TrackScreen category="AccountSettings" />
        <AccountNameRow account={account} navigation={navigation} />
        <AccountUnitsRow account={account} navigation={navigation} />
        <AccountCurrencyRow
          currency={account.currency}
          navigation={navigation}
        />
        <AccountAdvancedLogsRow account={account} navigation={navigation} />
        <DeleteAccountRow onPress={this.onPress} />
        <DeleteAccountModal
          isOpen={isModalOpened}
          onRequestClose={this.onRequestClose}
          deleteAccount={this.deleteAccount}
          account={account}
        />
      </SettingsNavigationScrollView>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountSettings);
