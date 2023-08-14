import React, { useCallback, useContext, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../analytics";
import ValidateError from "../../components/ValidateError";

import { context as _wcContext, setCurrentCallRequestError } from "../WalletConnect/Provider";
import { ScreenName } from "../../const";
import type { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";

type Navigation = CompositeScreenProps<
  StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionValidationError>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function ValidationError({ navigation, route }: Navigation) {
  const { colors } = useTheme();
  const { error } = route.params;
  const wcContext = useContext(_wcContext);
  const [disableRetry, setDisableRetry] = useState(false);
  useEffect(() => {
    if (wcContext.currentCallRequestId) {
      setDisableRetry(true);
      setCurrentCallRequestError(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
      <TrackScreen category="SignTransaction" name="ValidationError" />
      {error && (
        <ValidateError
          error={error}
          onRetry={!disableRetry ? retry : undefined}
          onClose={onClose}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
