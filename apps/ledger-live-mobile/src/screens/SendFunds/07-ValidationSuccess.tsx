import React, { useCallback, useContext, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import type { Operation } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import { ScreenName } from "../../const";
import PreventNativeBack from "../../components/PreventNativeBack";
import ValidateSuccess from "../../components/ValidateSuccess";

import {
  // eslint-disable-next-line import/named
  context as _wcContext,
  // eslint-disable-next-line import/named
  setCurrentCallRequestResult,
  // eslint-disable-next-line import/named
  STATUS,
} from "../WalletConnect/Provider";

type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};
type RouteParams = {
  accountId: string;
  deviceId: string;
  transaction: any;
  result: Operation;
};
export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const wcContext = useContext(_wcContext);
  const currency = account ? getAccountCurrency(account) : null;
  useEffect(() => {
    if (!account) return;
    let result = route.params?.result;
    if (!result) return;
    result =
      result.subOperations && result.subOperations[0]
        ? result.subOperations[0]
        : result;

    if (wcContext.currentCallRequestId) {
      setCurrentCallRequestResult(result.hash);
    }
  }, []);
  const onClose = useCallback(() => {
    navigation.getParent().pop();
  }, [navigation]);
  const goToOperationDetails = useCallback(() => {
    if (!account) return;
    const result = route.params?.result;
    if (!result) return;
    navigation.navigate(ScreenName.OperationDetails, {
      disableAllLinks: wcContext.status === STATUS.CONNECTED,
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      operation:
        result.subOperations && result.subOperations[0]
          ? result.subOperations[0]
          : result,
    });
  }, [
    account,
    route.params?.result,
    navigation,
    wcContext.status,
    parentAccount,
  ]);
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen
        category="SendFunds"
        name="ValidationSuccess"
        currencyName={currency?.name}
      />
      <PreventNativeBack />
      <ValidateSuccess onClose={onClose} onViewDetails={goToOperationDetails} />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
