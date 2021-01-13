// @flow
import React, { useCallback } from "react";
import { StyleSheet, Linking, View } from "react-native";
import { Trans } from "react-i18next";
import SafeAreaView from "react-native-safe-area-view";
import Icon from "react-native-vector-icons/dist/Feather";
import type {
  TokenAccount,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { shortAddressPreview } from "@ledgerhq/live-common/lib/account/helpers";

import { useTheme } from "@react-navigation/native";
import LText from "../../components/LText";
import Button from "../../components/Button";

type Props = {
  onClose: () => void,
  account?: TokenAccount,
  token?: TokenCurrency,
  url: string,
};

const forceInset = { bottom: "always" };

const TokenContractAddress = ({ account, onClose, url, token }: Props) => {
  const { colors } = useTheme();
  const viewInExplorer = useCallback(() => {
    if (url) {
      Linking.openURL(url);
      onClose();
    }
  }, [onClose, url]);

  const contractAddress = account
    ? account.token.contractAddress
    : token
    ? token.contractAddress
    : "";

  return (
    <SafeAreaView forceInset={forceInset} style={styles.root}>
      <View style={[styles.iconWrapper, { backgroundColor: colors.lightLive }]}>
        <Icon name="file-text" size={24} color={colors.live} />
      </View>
      <View style={styles.textWrapper}>
        <LText secondary bold style={styles.textTitle}>
          <Trans i18nKey="account.tokens.contractAddress" />
        </LText>
        <LText style={styles.textContract} color="smoke">
          {shortAddressPreview(contractAddress, 30)}
        </LText>
      </View>
      <View style={styles.footerContainer}>
        <Button
          type="secondary"
          title={<Trans i18nKey="common.close" />}
          containerStyle={styles.buttonContainer}
          event="CloseViewContractInExplorer"
          onPress={onClose}
        />
        <Button
          type="primary"
          title={<Trans i18nKey="account.tokens.viewInExplorer" />}
          containerStyle={[styles.buttonContainer, styles.buttonMarginLeft]}
          event="GoToViewContractInExplorer"
          onPress={viewInExplorer}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: 56,
    height: 56,
    borderRadius: 56,
  },
  textWrapper: {
    marginTop: 16,
    alignItems: "center",
  },
  textTitle: {
    fontSize: 16,
  },
  textContract: {
    marginTop: 8,
    fontSize: 14,
  },
  footerContainer: {
    flexDirection: "row",
  },
  buttonContainer: {
    flex: 1,
    marginTop: 30,
  },
  buttonMarginLeft: {
    marginLeft: 16,
  },
});

export default TokenContractAddress;
