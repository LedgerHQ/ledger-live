/* @flow */
import React, { useCallback, useContext, useEffect, useState } from "react";
import { StyleSheet, Linking } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import type { Account, AccountLike } from "@ledgerhq/live-common/types/index";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../analytics";
import ValidateError from "../../components/ValidateError";
import { urls } from "../../config/urls";
/* eslint-disable import/named */
import {
  // $FlowFixMe
  context as _wcContext,
  // $FlowFixMe
  setCurrentCallRequestError,
} from "../WalletConnect/Provider";
/* eslint-enable import/named */

const forceInset = { bottom: "always" };

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  parentId: string,
  deviceId: string,
  transaction: any,
  error: Error,
  onReject: (error: Error) => void,
};

export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { error } = route.params;
  const wcContext = useContext(_wcContext);
  const [disableRetry, setDisableRetry] = useState(false);

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
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <TrackScreen category="SignTransaction" name="ValidationError" />
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
