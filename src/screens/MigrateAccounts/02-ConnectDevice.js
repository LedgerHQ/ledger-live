// @flow

import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/app";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import connectApp from "@ledgerhq/live-common/lib/hw/connectApp";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../analytics";
import { ScreenName } from "../../const";
import SelectDevice from "../../components/SelectDevice";
import NavigationScrollView from "../../components/NavigationScrollView";
import DeviceActionModal from "../../components/DeviceActionModal";

const forceInset = { bottom: "always" };

const action = createAction(connectApp);

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  currency: Currency,
};

export default function ConnectDevice({ navigation, route }: Props) {
  const { colors } = useTheme();
  const [device, setDevice] = useState<?Device>();

  const onResult = useCallback(
    result => {
      setDevice();
      navigation.navigate(ScreenName.MigrateAccountsProgress, {
        currency: route.params?.currency,
        ...result,
      });
    },
    [navigation, route.params],
  );

  const onClose = useCallback(() => {
    setDevice();
  }, []);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <TrackScreen category="MigrateAccount" name="ConnectDevice" />
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <SelectDevice onSelect={setDevice} autoSelectOnAdd />
      </NavigationScrollView>
      <DeviceActionModal
        action={action}
        device={device}
        onResult={onResult}
        onClose={onClose}
        request={{ currency: route.params.currency }}
      />
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
