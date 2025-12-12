import React, { useState, useCallback } from "react";
import { useDispatch } from "~/context/store";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { CompositeScreenProps } from "@react-navigation/native";
import { useAccountScreen } from "~/hooks/useAccountScreen";
import { deleteAccount } from "~/actions/accounts";
import { TrackScreen } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import AccountNameRow from "./AccountNameRow";
import DeleteAccountRow from "./DeleteAccountRow";
import DeleteAccountModal from "./DeleteAccountModal";
import AccountAdvancedLogsRow from "./AccountAdvancedLogsRow";
import SettingsNavigationScrollView from "../Settings/SettingsNavigationScrollView";
import type { AccountSettingsNavigatorParamList } from "~/components/RootNavigator/types/AccountSettingsNavigator";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

export type NavigationProps = CompositeScreenProps<
  StackNavigatorProps<AccountSettingsNavigatorParamList, ScreenName.AccountSettingsMain>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

function AccountSettings({ navigation, route }: NavigationProps) {
  const dispatch = useDispatch();
  const { account, parentAccount } = useAccountScreen(route);
  const [isModalOpened, setIsModalOpened] = useState(false);

  const onRequestClose = useCallback(() => {
    setIsModalOpened(false);
  }, []);

  const onPress = useCallback(() => {
    setIsModalOpened(true);
  }, []);

  const handleDeleteAccount = useCallback(() => {
    if (!account) return;
    const mainAccount = getMainAccount(account, parentAccount);
    if (mainAccount) {
      dispatch(deleteAccount(mainAccount));
    }
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
  }, [account, parentAccount, dispatch, navigation, route?.params?.hasOtherAccountsForThisCrypto]);

  if (!account) return null;

  const mainAccount = getMainAccount(account, parentAccount);

  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Account Settings" />
      <AccountNameRow account={mainAccount} navigation={navigation} />
      <AccountAdvancedLogsRow account={mainAccount} navigation={navigation} />
      <DeleteAccountRow onPress={onPress} />
      <DeleteAccountModal
        isOpen={isModalOpened}
        onRequestClose={onRequestClose}
        deleteAccount={handleDeleteAccount}
        account={mainAccount}
      />
    </SettingsNavigationScrollView>
  );
}

export default AccountSettings;
