/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import type { Operation } from "@ledgerhq/live-common/lib/types";
import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import { ScreenName } from "../../const";
import PreventNativeBack from "../../components/PreventNativeBack";
import ValidateSuccess from "../../components/ValidateSuccess";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  deviceId: string,
  transaction: any,
  result: Operation,
};

export default function ValidationSuccess({ navigation, route }: Props) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  const onClose = useCallback(() => {
    navigation.dangerouslyGetParent().pop();
  }, [navigation]);

  const goToOperationDetails = useCallback(() => {
    if (!account) return;
    const result = route.params?.result;
    if (!result) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      operation:
        result.subOperations && result.subOperations[0]
          ? result.subOperations[0]
          : result,
    });
  }, [navigation, route.params, account, parentAccount]);

  return (
    <View style={styles.root}>
      <TrackScreen category="SendFunds" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess onClose={onClose} onViewDetails={goToOperationDetails} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
