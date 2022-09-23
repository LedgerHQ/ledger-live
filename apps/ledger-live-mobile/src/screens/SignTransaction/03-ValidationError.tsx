import React, { useCallback, useContext, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../analytics";
import ValidateError from "../../components/ValidateError";

import {
  context as _wcContext,
  setCurrentCallRequestError,
} from "../WalletConnect/Provider";

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
  onReject: (_: Error) => void;
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
      <ValidateError
        error={error}
        onRetry={!disableRetry ? retry : undefined}
        onClose={onClose}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
