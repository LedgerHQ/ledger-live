// @flow
import React, { useCallback } from "react";
import { StyleSheet, Linking, View } from "react-native";
import { Trans } from "react-i18next";
import { SafeAreaView } from "react-navigation";
import Icon from "react-native-vector-icons/dist/Feather";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import {
  getDefaultExplorerView,
  getAccountContractExplorer,
} from "@ledgerhq/live-common/lib/explorers";
import {
  getMainAccount,
  shortAddressPreview,
} from "@ledgerhq/live-common/lib/account/helpers";

import colors from "../../colors";
import LText from "../../components/LText";
import Button from "../../components/Button";

type Props = {
  onClose: () => void,
  account: TokenAccount,
  parentAccount: Account,
};

const forceInset = { bottom: "always" };

const TokenContractAddress = ({ account, parentAccount, onClose }: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const explorerView = getDefaultExplorerView(mainAccount.currency);

  const viewInExplorer = useCallback(() => {
    const url = getAccountContractExplorer(
      explorerView,
      account,
      parentAccount,
    );

    if (url) {
      Linking.openURL(url);
      onClose();
    }
  }, [explorerView, account, parentAccount, onClose]);

  return (
    <SafeAreaView forceInset={forceInset} style={styles.root}>
      <View style={styles.iconWrapper}>
        <Icon name="file-text" size={24} color={colors.live} />
      </View>
      <View style={styles.textWrapper}>
        <LText secondary bold style={styles.textTitle}>
          <Trans i18nKey="account.tokens.contractAddress" />
        </LText>
        <LText style={styles.textContract}>
          {shortAddressPreview(account.token.contractAddress, 30)}
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
    backgroundColor: colors.lightLive,
  },
  textWrapper: {
    marginTop: 16,
    alignItems: "center",
  },
  textTitle: {
    color: colors.darkBlue,
    fontSize: 16,
  },
  textContract: {
    marginTop: 8,
    color: colors.smoke,
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
