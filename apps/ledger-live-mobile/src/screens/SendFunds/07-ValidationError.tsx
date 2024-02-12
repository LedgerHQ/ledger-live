import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";

import { TrackScreen } from "~/analytics";
import ValidateError from "~/components/ValidateError";
import { accountScreenSelector } from "~/reducers/accounts";
import { ScreenName } from "~/const";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";

type Props = CompositeScreenProps<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendValidationError>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const error = route.params?.error;

  const { account } = useSelector(accountScreenSelector(route));
  const currency = account ? getAccountCurrency(account) : null;

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="SendFunds" name="ValidationError" currencyName={currency?.name} />
      {error && <ValidateError error={error} onRetry={retry} onClose={onClose} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
