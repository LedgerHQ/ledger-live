import React, { PureComponent } from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { connect } from "react-redux";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { CompositeScreenProps } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { accountScreenSelector } from "../../reducers/accounts";
import { deleteAccount } from "../../actions/accounts";
import { TrackScreen } from "../../analytics";
import { NavigatorName, ScreenName } from "../../const";

import AccountNameRow from "./AccountNameRow";
import AccountUnitsRow from "./AccountUnitsRow";
import AccountCurrencyRow from "./AccountCurrencyRow";
import DeleteAccountRow from "./DeleteAccountRow";
import DeleteAccountModal from "./DeleteAccountModal";
import AccountAdvancedLogsRow from "./AccountAdvancedLogsRow";
import SettingsNavigationScrollView from "../Settings/SettingsNavigationScrollView";
import {
  AccountSettingsNavigatorProps,
  RootStackParamList,
} from "../../components/RootNavigator/types";
import { State as StoreState } from "../../reducers/types";

type Props = {
  account?: AccountLike | null;
  parentAccount?: Account | null;
  deleteAccount: (account: Account) => void;
} & NavigationProps;

type NavigationProps = CompositeScreenProps<
  AccountSettingsNavigatorProps<ScreenName.AccountSettingsMain>,
  StackScreenProps<RootStackParamList>
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
    const { account, parentAccount, deleteAccount, navigation } = this.props;
    if (!account) return;
    const mainAccount = getMainAccount(account, parentAccount);
    mainAccount && deleteAccount(mainAccount);
    navigation.replace<keyof RootStackParamList>(NavigatorName.Base);
  };

  render() {
    const { navigation, account, parentAccount } = this.props;
    const { isModalOpened } = this.state;

    if (!account) return null;

    const mainAccount = getMainAccount(account, parentAccount);

    return (
      <SettingsNavigationScrollView>
        <TrackScreen category="AccountSettings" />
        <AccountNameRow account={mainAccount} navigation={navigation} />
        <AccountUnitsRow account={mainAccount} navigation={navigation} />
        <AccountCurrencyRow
          currency={mainAccount.currency}
          navigation={navigation}
        />
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
