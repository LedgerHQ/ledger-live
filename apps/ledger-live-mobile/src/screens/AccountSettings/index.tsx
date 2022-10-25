import React, { PureComponent } from "react";
import { Account } from "@ledgerhq/types-live";
import { connect } from "react-redux";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { accountScreenSelector } from "../../reducers/accounts";
import { deleteAccount } from "../../actions/accounts";
import { TrackScreen } from "../../analytics";
import { NavigatorName, ScreenName } from "../../const";

import AccountNameRow from "./AccountNameRow";
import AccountUnitsRow from "./AccountUnitsRow";
import DeleteAccountRow from "./DeleteAccountRow";
import DeleteAccountModal from "./DeleteAccountModal";
import AccountAdvancedLogsRow from "./AccountAdvancedLogsRow";
import SettingsNavigationScrollView from "../Settings/SettingsNavigationScrollView";

type Props = {
  navigation: any;
  route: { params: RouteParams };
  account: Account;
  // eslint-disable-next-line @typescript-eslint/ban-types
  deleteAccount: Function;
};

type RouteParams = {
  accountId: string;
  hasOtherAccountsForThisCrypto?: boolean;
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
    const { account, deleteAccount, navigation, route } = this.props;
    deleteAccount(account);
    if (route?.params?.hasOtherAccountsForThisCrypto) {
      const currency = getAccountCurrency(account);
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: {
          currency,
        },
      });
    } else {
      navigation.replace(NavigatorName.Base);
    }
  };

  render() {
    const { navigation, account } = this.props;
    const { isModalOpened } = this.state;

    if (!account) return null;
    return (
      <SettingsNavigationScrollView>
        <TrackScreen category="Account Settings" />
        <AccountNameRow account={account} navigation={navigation} />
        <AccountUnitsRow account={account} navigation={navigation} />
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
