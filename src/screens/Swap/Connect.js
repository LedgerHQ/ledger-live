// @flow

import React, { useState } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import connectManager from "@ledgerhq/live-common/lib/hw/connectManager";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/manager";
import { useTheme } from "@react-navigation/native";
import SelectDevice from "../../components/SelectDevice";
import DeviceActionModal from "../../components/DeviceActionModal";
import LText from "../../components/LText";
import { TrackScreen } from "../../analytics";

const action = createAction(connectManager);

const Connect = ({ setResult }: { setResult: (result: any) => void }) => {
  const [device, setDevice] = useState(null);
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="Swap" name="ConnectDeviceListApps" />
      <LText semiBold style={styles.selectDevice}>
        <Trans i18nKey={"transfer.swap.selectDevice"} />
      </LText>
      <SelectDevice onSelect={setDevice} autoSelectOnAdd />
      <DeviceActionModal
        onClose={setDevice}
        device={device}
        onResult={setResult}
        action={action}
        request={null}
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
