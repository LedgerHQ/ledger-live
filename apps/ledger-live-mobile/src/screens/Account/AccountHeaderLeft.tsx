import React, { useCallback } from "react";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { ArrowLeftMedium } from "@ledgerhq/native-ui/assets/icons";
import { ScreenName } from "~/const";
import Touchable from "~/components/Touchable";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";

import { Flex } from "@ledgerhq/native-ui";
import { track } from "~/analytics";
import { isWalletConnectSupported } from "@ledgerhq/live-common/walletConnect/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

type Props = {
  currency: CryptoOrTokenCurrency;
};
export default function AccountHeaderLeft({ currency }: Props) {
  const isWalletConnectActionDisplayable = isWalletConnectSupported(currency);

  const navigation =
    useNavigation<
      NavigationProp<AccountsNavigatorParamList & BaseNavigatorStackParamList, ScreenName.Account>
    >();

  const onBackButtonPress = useCallback(() => {
    track("button_clicked", {
      button: "Back",
      page: "Account",
    });
    navigation.goBack();
  }, [navigation]);

  return (
    <Flex flexDirection={"row"}>
      <Touchable onPress={onBackButtonPress}>
        <ArrowLeftMedium size={24} />
      </Touchable>
      {isWalletConnectActionDisplayable && <Flex ml={7} width={24} />}
    </Flex>
  );
}
