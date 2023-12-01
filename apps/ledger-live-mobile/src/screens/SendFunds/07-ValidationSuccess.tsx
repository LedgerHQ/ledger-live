import React, { useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { accountScreenSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";

import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type Props = CompositeScreenProps<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendValidationSuccess>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  const currency = account ? getAccountCurrency(account) : null;
  useEffect(() => {
    if (!account) return;
    let result = route.params?.result;
    if (!result) return;
    result = result.subOperations && result.subOperations[0] ? result.subOperations[0] : result;

    // FIXME: IT LOOKS LIKE A COMPONENT DID MOUNT BUT NOT SURE AT ALL IF
    // IT NEEDS TO BE RERUN WHEN DEPS CHANGE
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);
  const goToOperationDetails = useCallback(() => {
    if (!account) return;
    const result = route.params?.result;
    if (!result) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      parentId: (parentAccount && parentAccount.id) || undefined,
      operation: result.subOperations && result.subOperations[0] ? result.subOperations[0] : result,
    });
  }, [account, route.params?.result, navigation, parentAccount]);
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="SendFunds" name="ValidationSuccess" currencyName={currency?.name} />
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
