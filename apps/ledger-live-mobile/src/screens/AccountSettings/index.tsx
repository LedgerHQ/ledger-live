import React, { PureComponent } from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { connect } from "react-redux";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { CompositeScreenProps } from "@react-navigation/native";
import { accountScreenSelector } from "~/reducers/accounts";
import { deleteAccount } from "~/actions/accounts";
import { TrackScreen } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";

import AccountNameRow from "./AccountNameRow";
import AccountUnitsRow from "./AccountUnitsRow";
import DeleteAccountRow from "./DeleteAccountRow";
import DeleteAccountModal from "./DeleteAccountModal";
import AccountAdvancedLogsRow from "./AccountAdvancedLogsRow";
import SettingsNavigationScrollView from "../Settings/SettingsNavigationScrollView";
import { State as StoreState } from "~/reducers/types";
import type { AccountSettingsNavigatorParamList } from "~/components/RootNavigator/types/AccountSettingsNavigator";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type Props = {
  account?: AccountLike | null;
  parentAccount?: Account | null;
  deleteAccount: (account: Account) => void;
} & NavigationProps;

export type NavigationProps = CompositeScreenProps<
  StackNavigatorProps<AccountSettingsNavigatorParamList, ScreenName.AccountSettingsMain>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

type State = {
  isModalOpened: boolean;
};

const mapStateToProps = (state: StoreState, props: NavigationProps) =>
  accountScreenSelector(props.route)(state);

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
    const { account, parentAccount, deleteAccount, navigation, route } = this.props;
    if (!account) return;
    const mainAccount = getMainAccount(account, parentAccount);
    mainAccount && deleteAccount(mainAccount);
    if (route?.params?.hasOtherAccountsForThisCrypto) {
      const currency = getAccountCurrency(account);
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: {
          currency,
        },
      });
    } else {
      // @ts-expect-error The bindings seem to be wrong here
      navigation.replace(NavigatorName.Base);
    }
  };

  render() {
    const { navigation, account, parentAccount } = this.props;
    const { isModalOpened } = this.state;

    if (!account) return null;

    const mainAccount = getMainAccount(account, parentAccount);

    return (
      <SettingsNavigationScrollView>
        <TrackScreen category="Account Settings" />
        <AccountNameRow account={mainAccount} navigation={navigation} />
        <AccountUnitsRow account={mainAccount} navigation={navigation} />
        <AccountAdvancedLogsRow account={mainAccount} navigation={navigation} />
        <DeleteAccountRow onPress={this.onPress} />
        <DeleteAccountModal
          isOpen={isModalOpened}
          onRequestClose={this.onRequestClose}
          deleteAccount={this.deleteAccount}
          account={mainAccount}
        />
      </SettingsNavigationScrollView>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountSettings);
