/* @flow */
import React, { useCallback } from "react";
import { StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import ValidateError from "../../../components/ValidateError";
import { urls } from "../../../config/urls";
import {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";
import { CardanoDelegationFlowParamList } from "./types";
import { ScreenName } from "../../../const";

const forceInset = { bottom: "always" };

type Props = BaseComposite<
  StackNavigatorProps<
    CardanoDelegationFlowParamList,
    ScreenName.CardanoDelegationValidationError
  >
>;

export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation
      .getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()
      .pop();
  }, [navigation]);

  const contactUs = useCallback(() => {
    Linking.openURL(urls.contact);
  }, []);

  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const error = route.params.error;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <TrackScreen category="CardanoDelegation" name="ValidationError" />
      <ValidateError
        error={error}
        onRetry={retry}
        onClose={onClose}
        onContactUs={contactUs}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
