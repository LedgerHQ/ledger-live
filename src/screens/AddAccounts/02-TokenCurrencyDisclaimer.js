// @flow

import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { StyleSheet, View, Linking } from "react-native";
import SafeAreaView from "react-native-safe-area-view";

import type { TokenCurrency } from "@ledgerhq/live-common/lib/types";

import colors from "../../colors";
import Info from "../../icons/Info";
import ExternalLink from "../../components/ExternalLink";
import CurrencyIcon from "../../components/CurrencyIcon";
import Button from "../../components/Button";
import LText from "../../components/LText";
import { urls } from "../../config/urls";

const forceInset = { bottom: "always" };

const Disclaimer = ({
  tokenName,
  tokenType,
}: {
  tokenName: string,
  tokenType: string,
}) => (
  <View style={styles.disclaimer}>
    <Info size={18} color={colors.live} />
    <View style={styles.disclaimerTextWrapper}>
      <LText style={styles.disclaimerText}>
        <Trans
          i18nKey={`addAccounts.tokens.${tokenType}.disclaimer`}
          values={{ tokenName }}
        />
      </LText>
      <ExternalLink
        event="AddAccountsTokenDisclaimerLearnMore"
        color={colors.live}
        text={<Trans i18nKey={`addAccounts.tokens.${tokenType}.learnMore`} />}
        onPress={() => Linking.openURL(urls.supportLinkByTokenType[tokenType])}
      />
    </View>
  </View>
);

type RouteParams = {
  token: TokenCurrency,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

export default function AddAccountsTokenCurrencyDisclaimer({
  navigation,
  route,
}: Props) {
  const { t } = useTranslation();

  const token = route.params.token;
  const tokenName = `${token.name} (${token.ticker})`;

  function onBack(): void {
    navigation.goBack();
  }

  function onClose(): void {
    navigation.dangerouslyGetParent().pop();
  }

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <View style={styles.wrapper}>
        <CurrencyIcon size={56} radius={16} currency={token} />
      </View>
      <View style={[styles.wrapper, styles.spacer]}>
        <LText secondary bold style={styles.tokenName}>
          {tokenName}
        </LText>
      </View>
      <View style={styles.disclaimerWrapper}>
        <Disclaimer tokenName={tokenName} tokenType={token.tokenType} />
      </View>
      <View style={styles.buttonWrapper}>
        <Button
          event="AddAccountTokenDisclaimerBack"
          title={t("addAccounts.tokens.changeAssets")}
          type="secondary"
          onPress={onBack}
          containerStyle={[styles.button, styles.buttonSpace]}
        />

        <Button
          event="AddAccountTokenDisclaimerClose"
          title={t("common.close")}
          type="primary"
          onPress={onClose}
          containerStyle={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    paddingTop: 32,
  },
  wrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  spacer: {
    paddingTop: 16,
  },
  tokenName: {
    color: colors.darkBlue,
    fontSize: 18,
  },
  buttonWrapper: {
    flexDirection: "row",
  },
  button: {
    flex: 1,
  },
  buttonSpace: {
    marginRight: 16,
  },
  disclaimerWrapper: {
    flex: 1,
    paddingTop: 40,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 4,
    backgroundColor: colors.pillActiveBackground,
  },
  disclaimerTextWrapper: {
    flex: 1,
    paddingLeft: 16,
    alignItems: "flex-start",
  },
  disclaimerText: {
    fontSize: 14,
    color: colors.live,
    marginBottom: 16,
  },
});
