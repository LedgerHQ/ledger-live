/* @flow */
import React, { useCallback } from "react";
import { StyleSheet, Linking } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import ValidateError from "../../../components/ValidateError";
import { urls } from "../../../config/urls";

const forceInset = { bottom: "always" };

type RouteParams = {
  accountId: string,
  deviceId: string,
  transaction: any,
  error: Error,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation.dangerouslyGetParent().pop();
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
      <TrackScreen category="CosmosRedelegation" name="ValidationError" />
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
