import React, { useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { TrackScreen } from "~/analytics";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";

import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { SignMessageNavigatorStackParamList } from "~/components/RootNavigator/types/SignMessageNavigator";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";

export default function ValidationSuccess({
  navigation,
  route,
}: CompositeScreenProps<
  StackNavigatorProps<SignMessageNavigatorStackParamList, ScreenName.SignValidationSuccess>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { signature, onConfirmationHandler } = route.params;

  useEffect(() => {
    if (onConfirmationHandler && signature) {
      onConfirmationHandler(signature);
    }
  }, [onConfirmationHandler, signature]);
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="SignMessage" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        title={t("walletconnect.successTitle")}
        description={t("walletconnect.successDescription")}
        onClose={onClose}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
