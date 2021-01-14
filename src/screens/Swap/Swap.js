// @flow

import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { getProviders } from "@ledgerhq/live-common/lib/exchange/swap";
import { SwapNoAvailableProviders } from "@ledgerhq/live-common/lib/errors";
import { useSelector, useDispatch } from "react-redux";
import SafeAreaView from "react-native-safe-area-view";
import type {
  Account,
  AccountLike,
} from "@ledgerhq/live-common/lib/types/account";
import { useTheme } from "@react-navigation/native";
import {
  hasAcceptedSwapKYCSelector,
  swapProvidersSelector,
} from "../../reducers/settings";
import { setSwapProviders } from "../../actions/settings";
import MissingOrOutdatedSwapApp from "./MissingOrOutdatedSwapApp";
import Landing from "./Landing";
import NotAvailable from "./NotAvailable";
import Form from "./Form";
import Connect from "./Connect";

const Swap = ({
  defaultAccount,
  defaultParentAccount,
}: {
  defaultAccount?: AccountLike,
  defaultParentAccount?: Account,
}) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const providers = useSelector(swapProvidersSelector);
  const hasAcceptedSwapKYC = useSelector(hasAcceptedSwapKYCSelector);
  const [hasUpToDateProviders, setHasUpToDateProviders] = useState(false);
  const [deviceMeta, setDeviceMeta] = useState();

  useEffect(() => {
    if (hasAcceptedSwapKYC) {
      getProviders().then(maybeProviders => {
        dispatch(
          setSwapProviders(
            maybeProviders instanceof SwapNoAvailableProviders
              ? []
              : maybeProviders,
          ),
        );
        setHasUpToDateProviders(true);
      });
    }
  }, [dispatch, hasAcceptedSwapKYC]);

  const onSetResult = useCallback(
    data => {
      if (!data) return;
      setDeviceMeta(data);
    },
    [setDeviceMeta],
  );

  const exchangeApp = deviceMeta?.result?.installed.find(
    a => a.name === "Exchange",
  );
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      {!hasAcceptedSwapKYC ? (
        <Landing />
      ) : !hasUpToDateProviders ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : !providers?.length ? (
        <NotAvailable />
      ) : !deviceMeta?.result?.installed ? (
        <Connect setResult={onSetResult} />
      ) : !exchangeApp ? (
        <MissingOrOutdatedSwapApp />
      ) : !exchangeApp.updated ? (
        <MissingOrOutdatedSwapApp outdated />
      ) : deviceMeta ? (
        <Form
          deviceMeta={deviceMeta}
          providers={providers}
          defaultAccount={defaultAccount}
          defaultParentAccount={defaultParentAccount}
        />
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

export default Swap;
