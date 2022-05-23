import React from "react";
import { TouchableWithoutFeedback, View, StyleSheet } from "react-native";
// import { useRoute } from "@react-navigation/native";
// import { useSelector } from "react-redux";
import {
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";
import { AccountLike } from "@ledgerhq/live-common/lib/types";
import { Text } from "@ledgerhq/native-ui";
import { accountScreenSelector } from "../../reducers/accounts";
import ParentCurrencyIcon from "../../components/ParentCurrencyIcon";
import { scrollToTop } from "../../navigation/utils";

export default function AccountHeaderTitle() {
  // const route = useRoute();
  // const { account } = useSelector(accountScreenSelector(route));

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

  if (!account) return null;
  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <ParentCurrencyIcon
            size={32}
            currency={getAccountCurrency(account)}
          />
        </View>
        <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1} pr={8}>
          {getAccountName(account)}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    paddingRight: 32,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 32,
    paddingVertical: 5,
  },
  iconContainer: {
    marginRight: 8,
    justifyContent: "center",
  },
});
