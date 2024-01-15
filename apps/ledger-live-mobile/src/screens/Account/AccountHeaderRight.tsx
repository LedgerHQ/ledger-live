import React, { useState, useCallback, useEffect } from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import { NavigationProp, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { SettingsMedium, OthersMedium } from "@ledgerhq/native-ui/assets/icons";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { NavigatorName, ScreenName } from "~/const";
import Touchable from "~/components/Touchable";
import { accountScreenSelector, accountsSelector } from "~/reducers/accounts";
import TokenContextualModal from "../Settings/Accounts/TokenContextualModal";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";

import { Flex } from "@ledgerhq/native-ui";
import { WalletConnectAction } from "../WalletCentricAsset/WalletConnectHeader";
import { isWalletConnectSupported } from "@ledgerhq/live-common/walletConnect/index";

export default function AccountHeaderRight() {
  const navigation =
    useNavigation<
      NavigationProp<AccountsNavigatorParamList & BaseNavigatorStackParamList, ScreenName.Account>
    >();
  const route =
    useRoute<
      RouteProp<AccountsNavigatorParamList & BaseNavigatorStackParamList, ScreenName.Account>
    >();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const accounts = useSelector(accountsSelector);

  const [isOpened, setOpened] = useState(false);

  const toggleModal = useCallback(() => setOpened(!isOpened), [isOpened]);
  const closeModal = () => {
    setOpened(false);
  };

  const currency = getAccountCurrency(account);
  const cryptoAccounts = accounts.filter(account => account.currency.id === currency.id);
  const isWalletConnectActionDisplayable = isWalletConnectSupported(currency);

  useEffect(() => {
    if (!account) {
      navigation.navigate(ScreenName.Accounts);
    }
  }, [account, navigation]);

  if (!account) return null;

  if (account.type === "TokenAccount" && parentAccount) {
    return (
      <>
        <Touchable
          event="ShowContractAddress"
          onPress={toggleModal}
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <View>
            <OthersMedium size={24} color={"neutral.c100"} />
          </View>
        </Touchable>
        <TokenContextualModal account={account} isOpened={isOpened} onClose={closeModal} />
      </>
    );
  }

  if (account.type === "Account") {
    return (
      <Flex flexDirection="row">
        {isWalletConnectActionDisplayable && (
          <Flex mr={7}>
            <WalletConnectAction currency={currency} event={"WalletConnect Account Button"} />
          </Flex>
        )}

        <Touchable
          event="button_clicked"
          eventProperties={{
            button: "Account Settings",
          }}
          onPress={() => {
            navigation.navigate(NavigatorName.AccountSettings, {
              screen: ScreenName.AccountSettingsMain,
              params: {
                accountId: account.id,
                hasOtherAccountsForThisCrypto: cryptoAccounts && cryptoAccounts.length > 1,
              },
            });
          }}
        >
          <SettingsMedium size={24} />
        </Touchable>
      </Flex>
    );
  }

  return null;
}
