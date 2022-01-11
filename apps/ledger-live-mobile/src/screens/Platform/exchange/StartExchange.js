// @flow
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import connectApp from "@ledgerhq/live-common/lib/hw/connectApp";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/startExchange";
import startExchange from "@ledgerhq/live-common/lib/exchange/platform/startExchange";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import DeviceActionModal from "../../../components/DeviceActionModal";
import SelectDevice from "../../../components/SelectDevice";

type Result = {
  startExchangeResult?: number,
  startExchangeError?: Error,
  device: Device,
};

export default function PlatformStartExchange({
  navigation,
  route,
}: {
  navigation: *,
  route: {
    params: {
      request: { exchangeType: number },
      onResult: (result: Result) => void,
    },
  },
}) {
  const [device, setDevice] = useState(null);

  return (
    <SafeAreaView style={styles.root}>
      <SelectDevice onSelect={setDevice} autoSelectOnAdd />
      <DeviceActionModal
        device={device}
        action={action}
        onClose={() => navigation.pop()}
        onResult={result => {
          route.params.onResult({ ...result, device });
        }}
        request={route.params.request}
      />
    </SafeAreaView>
  );
}

const action = createAction(connectApp, startExchange);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 32,
  },
});
