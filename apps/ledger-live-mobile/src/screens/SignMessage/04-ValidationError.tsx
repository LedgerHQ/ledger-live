import React, { useCallback, useContext, useEffect, useState } from "react";
import { StyleSheet, Linking } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import type { TypedMessageData } from "@ledgerhq/live-common/families/ethereum/types";
import type { MessageData } from "@ledgerhq/live-common/hw/signMessage/types";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../analytics";
import ValidateError from "../../components/ValidateError";
import { urls } from "../../config/urls";

import {
  // eslint-disable-next-line import/named
  context as _wcContext,
  // eslint-disable-next-line import/named
  setCurrentCallRequestError,
} from "../WalletConnect/Provider";

const forceInset = {
  bottom: "always",
};
type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};
type RouteParams = {
  accountId: string;
  message: TypedMessageData | MessageData;
  error: Error;
  onFailHandler?: (_: Error) => void;
};
export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { error, onFailHandler } = route.params;
  const wcContext = useContext(_wcContext);
  const [disableRetry, setDisableRetry] = useState(false);
  useEffect(() => {
    if (wcContext.currentCallRequestId) {
      setDisableRetry(true);
      setCurrentCallRequestError(error);
    }

    if (onFailHandler) {
      onFailHandler(error);
    }
  }, [wcContext.currentCallRequestId, onFailHandler, error]);
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
      <TrackScreen category="SignMessage" name="ValidationError" />
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
