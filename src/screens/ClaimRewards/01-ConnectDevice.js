// @flow
import React, { useCallback } from "react";
import { StyleSheet, ScrollView } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import invariant from "invariant";
import type { Transaction } from "@ledgerhq/live-common/lib/types";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import { ScreenName } from "../../const";
import SelectDevice from "../../components/SelectDevice";
import { connectingStep, accountApp } from "../../components/DeviceJob/steps";
import { accountScreenSelector } from "../../reducers/accounts";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
};

export default function ConnectDevice({ navigation, route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");

  const bridge = getAccountBridge(account, undefined);

  const { transaction, status } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(account);

    const transaction = bridge.updateTransaction(t, {
      mode: "claimReward",
    });

    return { account, transaction };
  });

  const onSelectDevice = useCallback(
    (meta: *) => {
      navigation.replace(ScreenName.ClaimRewardsValidation, {
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
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="ClaimRewards" name="ConnectDevice" />
        <SelectDevice
          onSelect={onSelectDevice}
          steps={[connectingStep, accountApp(account)]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
});
