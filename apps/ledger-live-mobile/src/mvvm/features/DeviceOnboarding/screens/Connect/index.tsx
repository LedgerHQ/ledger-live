import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ConnectNewDevice } from "LLM/components/ConnectNewDevice";
import { DeviceOnboardingCloseBar } from "../../components/CloseBar";
import { useDeviceOnboardingConnectViewModel } from "./useDeviceOnboardingConnectViewModel";

export function DeviceOnboardingConnect() {
  const { bottom } = useSafeAreaInsets();
  const { closeLabel, showDeviceList, onConnected, onClose, onDeviceNotFound } =
    useDeviceOnboardingConnectViewModel();

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }} style={{ paddingBottom: bottom }}>
      <DeviceOnboardingCloseBar
        label={closeLabel}
        testID="onboarding-connect-close"
        onPress={onClose}
      />
      <Box lx={{ flex: 1 }}>
        {showDeviceList ? (
          <ConnectNewDevice
            onConnected={onConnected}
            onClose={onClose}
            onDeviceNotFound={onDeviceNotFound}
          />
        ) : null}
      </Box>
    </Box>
  );
}
