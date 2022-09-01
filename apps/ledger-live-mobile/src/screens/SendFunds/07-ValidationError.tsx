import React, { useCallback, useContext, useEffect, useState } from "react";
import { StyleSheet, Linking } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { TrackScreen } from "../../analytics";
import ValidateError from "../../components/ValidateError";
import { urls } from "../../config/urls";
import {
  // eslint-disable-next-line import/named
  context as _wcContext,
  // eslint-disable-next-line import/named
  setCurrentCallRequestError,
} from "../WalletConnect/Provider";
import { accountScreenSelector } from "../../reducers/accounts";

const forceInset = {
  bottom: "always",
};
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
};
export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const error = route.params.error;
  const wcContext = useContext(_wcContext);
  const [disableRetry, setDisableRetry] = useState(false);
  const { account } = useSelector(accountScreenSelector(route));
  const currency = account ? getAccountCurrency(account) : null;
  useEffect(() => {
    if (wcContext.currentCallRequestId) {
      setDisableRetry(true);
      setCurrentCallRequestError(error);
    }
  }, []);
  const onClose = useCallback(() => {
    navigation.getParent().pop();
  }, [navigation]);
  const contactUs = useCallback(() => {
    Linking.openURL(urls.contact);
  }, []);
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
      forceInset={forceInset}
    >
      <TrackScreen
        category="SendFunds"
        name="ValidationError"
        currencyName={currency?.name}
      />
      <ValidateError
        error={error}
        onRetry={!disableRetry ? retry : undefined}
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
