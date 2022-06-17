// @flow

import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import SafeAreaView from "react-native-safe-area-view";
import { useTheme, useRoute, useNavigation } from "@react-navigation/native";
import { useSwapProviders } from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import NotAvailable from "./NotAvailable";
import {
  providersSelector,
  resetSwapAction,
  updateProvidersAction,
} from "../../actions/swap";
import { ScreenName } from "../../const";
import Spinning from "../../components/Spinning";
import BigSpinner from "../../icons/BigSpinner";

// Check if any provider is available
// if yes -> SwapFormEntry
export default function SwapEntrypoint() {
  const { colors } = useTheme();
  const { replace } = useNavigation();
  const route = useRoute();

  const providerInfo = useProviders();
  const provider = providerInfo.providers?.[0].provider;

  useEffect(() => {
    if (!providerInfo.providers?.length || !provider) return;

    replace(ScreenName.SwapFormOrHistory, {
      defaultAccount: route?.params?.defaultAccount,
      defaultParentAccount: route?.params?.defaultParentAccount,
      providersError: providerInfo.providersError,
    });
  }, [providerInfo, provider, replace, route?.params]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      {!providerInfo.providers ? (
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
}

export function useProviders() {
  const dispatch = useDispatch();
  const { providers, error: providersError } = useSwapProviders();
  const storedProviders = useSelector(providersSelector);

  useEffect(() => {
    if (providers) dispatch(updateProvidersAction(providers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);

  useEffect(() => {
    if (providersError) dispatch(resetSwapAction());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providersError]);

  return {
    storedProviders,
    providers,
    providersError,
  };
}

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
