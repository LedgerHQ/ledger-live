/* @flow */
import React, { useCallback, useContext, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type { TypedMessageData } from "@ledgerhq/live-common/lib/families/ethereum/types";
import type { MessageData } from "@ledgerhq/live-common/lib/hw/signMessage/types";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../analytics";
import PreventNativeBack from "../../components/PreventNativeBack";
import ValidateSuccess from "../../components/ValidateSuccess";
import {
  context as _wcContext,
  setCurrentCallRequestResult,
} from "../WalletConnect/Provider";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  message: TypedMessageData | MessageData,
  signature: String,
};

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const wcContext = useContext(_wcContext);

  useEffect(() => {
    if (wcContext.currentCallRequestId) {
      setCurrentCallRequestResult(route.params.signature);
    }
  }, []);

  const onClose = useCallback(() => {
    navigation.dangerouslyGetParent().pop();
  }, [navigation]);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.white,
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
