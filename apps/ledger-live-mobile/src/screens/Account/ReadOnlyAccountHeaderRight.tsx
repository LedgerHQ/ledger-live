import React, { useState, useCallback } from "react";
import { View } from "react-native";
// import { useSelector } from "react-redux";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FiltersMedium, OthersMedium } from "@ledgerhq/native-ui/assets/icons";
import { AccountLike } from "@ledgerhq/live-common/lib/types";
import Touchable from "../../components/Touchable";
import TokenContextualModal from "../Settings/Accounts/TokenContextualModal";

export default function AccountHeaderRight() {
  const navigation = useNavigation();
  // const route = useRoute();
  // const { account, parentAccount } = useSelector(accountScreenSelector(route));

  const [isOpened, setOpened] = useState(false);

  const toggleModal = useCallback(() => setOpened(!isOpened), [isOpened]);
  const closeModal = () => {
    setOpened(false);
  };

  const account: AccountLike = {
    balance: 0,
    currency: {
      blockAvgTime: 15,
      coinType: 60,
      color: "#0ebdcd",
      ethereumLikeInfo: {
        baseChain: "mainnet",
        chainId: 1,
        hardfork: "petersburg",
        networkId: 1,
      },
      family: "ethereum",
      id: "ethereum",
      managerAppName: "Ethereum",
      name: "Ethereum",
      scheme: "ethereum",
      symbol: "Ξ",
      ticker: "ETH",
      type: "CryptoCurrency",
      units: [
        { code: "ETH", magnitude: 18, name: "ether" },
        { code: "Gwei", magnitude: 9, name: "Gwei" },
        { code: "Mwei", magnitude: 6, name: "Mwei" },
        { code: "Kwei", magnitude: 3, name: "Kwei" },
        { code: "wei", magnitude: 0, name: "wei" },
      ],
    },
    id: "1",
    type: "Account",
    name: "Ethereum",
    unit: { code: "ETH", magnitude: 18, name: "ether" },
  };

  const parentAccount = undefined;

  if (!account) return null;

  if (account.type === "TokenAccount" && parentAccount) {
    return (
      <>
        <Touchable
          event="ShowContractAddress"
          onPress={toggleModal}
          style={{ alignItems: "center", justifyContent: "center", margin: 16 }}
        >
          <View>
            <OthersMedium size={24} color={"neutral.c100"} />
          </View>
        </Touchable>
        <TokenContextualModal
          account={account}
          isOpened={isOpened}
          onClose={closeModal}
        />
      </>
    );
  }

  if (account.type === "Account") {
    return (
      <Touchable
        event="AccountGoSettings"
        onPress={() => {
          navigation.navigate(NavigatorName.AccountSettings, {
            screen: ScreenName.AccountSettingsMain,
            params: {
              accountId: account.id,
            },
          });
        }}
        style={{ alignItems: "center", justifyContent: "center", margin: 16 }}
      >
        <View>
          <FiltersMedium size={24} color="neutral.c100" />
        </View>
      </Touchable>
    );
  }

  return null;
}
