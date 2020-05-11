// @flow

import React, { useRef, useCallback } from "react";
import { WebView } from "react-native-webview";
import querystring from "querystring";
import i18next from "i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { createStructuredSelector } from "reselect";
// $FlowFixMe
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate, Trans } from "react-i18next";
import type {
  Account,
  AccountLikeArray,
} from "@ledgerhq/live-common/lib/types";
import { getConfig } from "./coinifyConfig";
import colors from "../../colors";
import {
  accountsSelector,
  flattenAccountsSelector,
} from "../../reducers/accounts";

import StepHeader from "../../components/StepHeader";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";

type Navigation = NavigationScreenProp<{ params: {} }>;

type Props = {
  accounts: Account[],
  allAccounts: AccountLikeArray,
  navigation: Navigation,
};

const CoinifyWidget = ({ navigation, allAccounts }: Props) => {
  const webView = useRef(null);
  const accountId = navigation.getParam("accountId");

  const account = allAccounts.find(a => a.id === accountId);

  const handleMessage = useCallback(event => {
    console.log("event: ", event);
  }, []);

  const coinifyConfig = getConfig("developpement");
  const widgetConfig = {
    fontColor: colors.darkBlue,
    primaryColor: colors.live,
    partnerId: coinifyConfig.partnerId,
    cryptoCurrencies: account.currency.ticker,
    address: account.freshAddress,
  };

  const url = `${coinifyConfig.url}?${querystring.stringify(widgetConfig)}`;
  const forceInset = { bottom: "always" };

  console.log(coinifyConfig, widgetConfig, url);

  return (
    <SafeAreaView
      style={[styles.root, { paddingTop: extraStatusBarPadding }]}
      forceInset={forceInset}
    >
      <WebView
        ref={webView}
        onError={console.log}
        onLoad={console.log}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        )}
        source={{
          uri: url,
        }}
        overScrollMode={false}
        onMessage={handleMessage}
        automaticallyAdjustContentInsets={false}
        scrollEnabled={true}
        style={{
          flex: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </SafeAreaView>
  );
};

CoinifyWidget.navigationOptions = {
  headerTitle: (
    <StepHeader
      title={i18next.t("transfer.receive.headerTitle")}
      subtitle={i18next.t("send.stepperHeader.stepRange", {
        currentStep: "3",
        totalSteps: "3",
      })}
    />
  ),
};

const mapStateToProps = createStructuredSelector({
  allAccounts: flattenAccountsSelector,
  accounts: accountsSelector,
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
  },
});

export default compose(
  connect(mapStateToProps),
  translate(),
)(CoinifyWidget);
