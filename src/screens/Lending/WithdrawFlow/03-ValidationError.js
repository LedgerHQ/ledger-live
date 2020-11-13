/* @flow */
import React, { useCallback } from "react";
import { StyleSheet, Linking, SafeAreaView } from "react-native";
import type {
  Account,
  AccountLike,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { TrackScreen } from "../../../analytics";
import colors from "../../../colors";
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
  const onClose = useCallback(() => {
    navigation.dangerouslyGetParent().pop();
  }, [navigation]);

  const contactUs = useCallback(() => {
    Linking.openURL(urls.contact);
  }, []);

  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const { currency, error } = route.params;

  return (
    <SafeAreaView style={styles.root}>
      <TrackScreen
        category="Lend Withdraw"
        name="Error"
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
    backgroundColor: colors.white,
  },
});
