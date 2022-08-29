import React, { useCallback, useContext, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type { TypedMessageData } from "@ledgerhq/live-common/families/ethereum/types";
import type { MessageData } from "@ledgerhq/live-common/hw/signMessage/types";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../analytics";
import PreventNativeBack from "../../components/PreventNativeBack";
import ValidateSuccess from "../../components/ValidateSuccess";

import {
  // eslint-disable-next-line import/named
  context as _wcContext,
  // eslint-disable-next-line import/named
  setCurrentCallRequestResult,
} from "../WalletConnect/Provider";

type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};
type RouteParams = {
  accountId: string;
  message: TypedMessageData | MessageData;
  signature: string;
  onConfirmationHandler?: (_: MessageData | TypedMessageData) => void;
};
export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { signature, onConfirmationHandler } = route.params;
  const wcContext = useContext(_wcContext);
  useEffect(() => {
    if (wcContext.currentCallRequestId) {
      setCurrentCallRequestResult(signature);
    }

    if (onConfirmationHandler) {
      onConfirmationHandler(signature);
    }
  }, [wcContext.currentCallRequestId, onConfirmationHandler, signature]);
  const onClose = useCallback(() => {
    navigation.getParent().pop();
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
