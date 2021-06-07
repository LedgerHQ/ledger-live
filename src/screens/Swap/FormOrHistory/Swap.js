// @flow

import React, { useState, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import SafeAreaView from "react-native-safe-area-view";
import { useTheme } from "@react-navigation/native";

import type {
  Account,
  AccountLike,
} from "@ledgerhq/live-common/lib/types/account";
import { getProviders } from "@ledgerhq/live-common/lib/exchange/swap";
import { SwapNoAvailableProviders } from "@ledgerhq/live-common/lib/errors";

import {
  hasAcceptedSwapKYCSelector,
  swapProvidersSelector,
} from "../../../reducers/settings";
import { setSwapProviders } from "../../../actions/settings";

import Landing from "./Landing";
import NotAvailable from "./NotAvailable";
import Form from "./Form";

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
      ) : (
        <Form
          providers={providers}
          defaultAccount={defaultAccount}
          defaultParentAccount={defaultParentAccount}
        />
      )}
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
