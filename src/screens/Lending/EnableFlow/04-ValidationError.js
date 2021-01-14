/* @flow */
import React, { useCallback } from "react";
import { StyleSheet, Linking, SafeAreaView } from "react-native";
import type {
  Account,
  AccountLike,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import ValidateError from "../../../components/ValidateError";
import { urls } from "../../../config/urls";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  parentId: String,
  deviceId: string,
  transaction: any,
  error: Error,
  currency: TokenCurrency,
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

  const { error, currency } = route.params;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="Lend Approve"
        name="Fail"
        eventProperties={{ currencyName: currency?.name }}
      />
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
