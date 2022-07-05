// @flow

import React from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import type { AccountLike } from "@ledgerhq/live-common/types/index";
import { useSelector } from "react-redux";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../reducers/accounts";

import CoinifyWidget from "./CoinifyWidget";

type RouteParams = {
  account: AccountLike,
  parentId: string,
  device: Device,
  mode: string,
  skipDevice?: Boolean,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

export default function CoinifyWidgetScreen({ route }: Props) {
  const { colors } = useTheme();
  const { parentAccount } = useSelector(accountScreenSelector(route));
  const { account, mode, device, skipDevice } = route.params;

  const forceInset = { bottom: "always" };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.card }]}
      forceInset={forceInset}
    >
      <CoinifyWidget
        account={account}
        parentAccount={parentAccount}
        device={device}
        mode={mode}
        verifyAddress
        skipDevice={skipDevice}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
