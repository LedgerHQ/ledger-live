import React, { useCallback } from "react";
import { StyleSheet, Linking, SafeAreaView } from "react-native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import ValidateError from "../../../components/ValidateError";
import { urls } from "../../../config/urls";

type Props = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  navigation: any;
  route: {
    params: RouteParams;
  };
};
type RouteParams = {
  accountId: string;
  parentId: string;
  deviceId: string;
  transaction: any;
  error: Error;
  currency: TokenCurrency;
};
export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation.getParent().pop();
  }, [navigation]);
  const contactUs = useCallback(() => {
    Linking.openURL(urls.contact);
  }, []);
  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  const { currency, error } = route.params;
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen
        category="Lend Withdraw"
        name="Error"
        eventProperties={{
          currencyName: currency?.name,
        }}
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
