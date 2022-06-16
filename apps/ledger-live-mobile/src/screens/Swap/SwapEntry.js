// @flow

import React, { useState, useEffect } from "react";
import Config from "react-native-config";
import { StyleSheet, View } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import SafeAreaView from "react-native-safe-area-view";
import { useTheme, useRoute, useNavigation } from "@react-navigation/native";
import { useSwapProviders } from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import { getSwapSelectableCurrencies } from "@ledgerhq/live-common/lib/exchange/swap/logic";
import NotAvailable from "./NotAvailable";
import { swapKYCSelector } from "../../reducers/settings";
import { setSwapSelectableCurrencies } from "../../actions/settings";
import { ScreenName } from "../../const";
import Spinning from "../../components/Spinning";
import BigSpinner from "../../icons/BigSpinner";

export const useProviders = () => {
  const { providers, error: providersError } = useSwapProviders();

  return {
    providers,
    providersError,
  };
};

const SwapEntrypoint = () => {
  const { colors } = useTheme();
  const { replace } = useNavigation();
  const route = useRoute();
  const swapKYC = useSelector(swapKYCSelector);

  const { providers } = useProviders();
  const provider = providers?.[0].provider;

  useEffect(() => {
    if (!providers?.length || !provider) return;
    if (provider === "wyre" && swapKYC?.wyre?.status !== "approved") {
      replace(ScreenName.SwapKYC, { provider });
    } else {
      replace(ScreenName.SwapFormOrHistory, {
        providers,
        provider,
        defaultAccount: route?.params?.defaultAccount,
        defaultParentAccount: route?.params?.defaultParentAccount,
      });
    }
  }, [replace, provider, providers, swapKYC, route?.params]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      {!providers ? (
        <View style={styles.loading}>
          <Spinning clockwise>
            <BigSpinner />
          </Spinning>
        </View>
      ) : !provider ? (
        <NotAvailable />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectDevice: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 20,
  },
  debugText: {
    marginBottom: 10,
  },
});

export default SwapEntrypoint;
