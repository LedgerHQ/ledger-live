import React from "react";
import { TouchableWithoutFeedback, View, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { getAccountCurrency, getAccountName } from "@ledgerhq/live-common/account/index";
import { Text } from "@ledgerhq/native-ui";
import { accountScreenSelector } from "../../reducers/accounts";
import ParentCurrencyIcon from "../../components/ParentCurrencyIcon";
import { scrollToTop } from "../../navigation/utils";

export default function AccountHeaderTitle() {
  const route = useRoute();
  const { account } = useSelector(accountScreenSelector(route));

  if (!account) return null;
  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <ParentCurrencyIcon size={32} currency={getAccountCurrency(account)} />
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
