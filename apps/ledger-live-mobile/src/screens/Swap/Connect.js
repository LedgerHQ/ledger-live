// @flow

import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import connectManager from "@ledgerhq/live-common/lib/hw/connectManager";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/manager";
import { useTheme } from "@react-navigation/native";
import SelectDevice from "../../components/SelectDevice";
import DeviceActionModal from "../../components/DeviceActionModal";
import { TrackScreen } from "../../analytics";
import SkipSelectDevice from "../SkipSelectDevice";

const action = createAction(connectManager);

const Connect = ({
  setResult,
  provider,
}: {
  setResult: (result: any) => void,
  provider?: string,
}) => {
  const [device, setDevice] = useState(null);
  const [result] = useState();

  const onModalHide = useCallback(() => {
    if (result) {
      // Nb need this in order to wait for the first modal to hide
      // see https://github.com/react-native-modal/react-native-modal#i-cant-show-multiple-modals-one-after-another
      setResult(result);
    }
  }, [result, setResult]);

  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="Swap Form"
        name="ConnectDeviceListApps"
        provider={provider}
      />
      <SkipSelectDevice onResult={setDevice} />
      <SelectDevice onSelect={setDevice} autoSelectOnAdd />
      <DeviceActionModal
        onClose={setDevice}
        onModalHide={onModalHide}
        device={result ? null : device}
        onResult={setResult}
        action={action}
        request={null}
        onSelectDeviceLink={() => setDevice()}
        analyticsPropertyFlow="swap"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
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

export default Connect;
