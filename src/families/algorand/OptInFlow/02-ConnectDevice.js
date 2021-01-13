// @flow
import invariant from "invariant";
import React, { useCallback } from "react";
import { StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { useSelector } from "react-redux";
import type { Transaction } from "@ledgerhq/live-common/lib/types";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../reducers/accounts";
import { ScreenName } from "../../../const";
import { TrackScreen } from "../../../analytics";
import SelectDevice from "../../../components/SelectDevice";
import {
  connectingStep,
  accountApp,
} from "../../../components/DeviceJob/steps";

type RouteParams = {
  accountId: string,
  transaction: Transaction,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

export default function ConnectDevice({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(
    account && account.algorandResources,
    "account and algorand resources required",
  );

  const mainAccount = getMainAccount(account, undefined);

  const { transaction, status } = useBridgeTransaction(() => {
    const transaction = route.params.transaction;
    return { account, transaction };
  });

  const onSelectDevice = useCallback(
    (meta: any) => {
      navigation.replace(ScreenName.AlgorandOptInValidation, {
        ...route.params,
        ...meta,
        transaction,
        status,
      });
    },
    [navigation, status, transaction, route.params],
  );

  if (!account) return null;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.white }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="AlgorandOptIn" name="ConnectDevice" />
        <SelectDevice
          onSelect={onSelectDevice}
          steps={[connectingStep, accountApp(mainAccount)]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
});
