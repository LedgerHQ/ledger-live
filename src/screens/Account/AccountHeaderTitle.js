/* @flow */
import React from "react";
import { TouchableWithoutFeedback, View, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import {
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";
import LText from "../../components/LText";
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
          <ParentCurrencyIcon
            size={18}
            currency={getAccountCurrency(account)}
          />
        </View>
        <LText semiBold secondary numberOfLines={1} style={styles.title}>
          {getAccountName(account)}
        </LText>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    paddingVertical: 5,
  },
  iconContainer: {
    marginRight: 8,
    justifyContent: "center",
  },
});
