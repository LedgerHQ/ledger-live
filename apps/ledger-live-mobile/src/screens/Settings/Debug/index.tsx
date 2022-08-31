import React from "react";
import { useNavigation } from "@react-navigation/native";
import config from "react-native-config";
import { Box, Text } from "@ledgerhq/native-ui";
import { TrackScreen } from "../../../analytics";
import SettingsRow from "../../../components/SettingsRow";
import SelectDevice from "../../../components/SelectDevice";
import { ScreenName } from "../../../const";

import GenerateMockAccounts from "./GenerateMockAccounts";
import ImportBridgeStreamData from "./ImportBridgeStreamData";
import ConfigUSBDeviceSupport from "./ConfigUSBDeviceSupport";
import OpenDebugCrash from "./OpenDebugCrash";
import OpenDebugHttpTransport from "./OpenDebugHttpTransport";
import OpenDebugIcons from "./OpenDebugIcons";
import ReadOnlyModeRow from "../General/ReadOnlyModeRow";
import AnalyticsConsoleRow from "./AnalyticsConsoleRow";
import OpenDebugStore from "./OpenDebugStore";
import OpenDebugPlayground from "./OpenDebugPlayground";
import OpenDebugFeatureFlags from "./OpenDebugFeatureFlags";
import OpenLottie from "./OpenDebugLottie";
import OpenDebugLogs from "./OpenDebugLogs";
import SkipLock from "../../../components/behaviour/SkipLock";
import AddMockAnnouncementButton from "./GenerateAnnouncementMockData";
import ToggleMockServiceStatusButton from "./ToggleMockStatusIncident";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";
import MockModeRow from "../General/MockModeRow";
import GenerateMockAccount from "./GenerateMockAccountsSelect";
import OpenDebugEnv from "./OpenDebugEnv";
import HasOrderedNanoRow from "./HasOrderedNanoRow";
import OpenDebugPostOnboarding from "./OpenDebugPostOnboarding";

export function DebugMocks() {
  return (
    <SettingsNavigationScrollView>
      {config.BRIDGESTREAM_DATA ? (
        // $FlowFixMe
        <ImportBridgeStreamData
          title="Import .env BRIDGESTREAM_DATA"
          dataStr={config.BRIDGESTREAM_DATA}
        />
      ) : null}
      <GenerateMockAccounts
        title="Generate 10 random mock Accounts"
        count={10}
      />
      <GenerateMockAccount />
      <OpenDebugLogs />
      <OpenDebugCrash />
      <OpenDebugStore />
      <OpenDebugEnv />
      <OpenDebugFeatureFlags />
      <OpenDebugIcons />
      <OpenLottie />
      <OpenDebugPostOnboarding />
      <OpenDebugPlayground />
      <ReadOnlyModeRow />
      <HasOrderedNanoRow />
      <MockModeRow />
      <AnalyticsConsoleRow />
      <AddMockAnnouncementButton title="Mock a new announcement" />
      <ToggleMockServiceStatusButton title="Toggle Service status incident" />
      <SkipLock />
    </SettingsNavigationScrollView>
  );
}

export function DebugDevices() {
  const { navigate } = useNavigation();

  function onSelect(meta: any): void {
    navigate(ScreenName.DebugBLE, meta);
  }

  return (
    <SettingsNavigationScrollView>
      <OpenDebugHttpTransport />
      <ConfigUSBDeviceSupport />
      <Box p={6}>
        <SelectDevice onSelect={onSelect} />
      </Box>
    </SettingsNavigationScrollView>
  );
}

export default function DebugSettings({ navigation: { navigate } }: any) {
  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="Debug" />
      <SettingsRow
        title="Mock & Test"
        onPress={() => navigate(ScreenName.DebugMocks)}
      />
      <SettingsRow
        title="Debug Devices"
        onPress={() => navigate(ScreenName.DebugDevices)}
      />
      <SettingsRow
        title="Debug Swap"
        onPress={() => navigate(ScreenName.DebugSwap)}
      />
      <SettingsRow
        title="Export accounts (LiveQR)"
        onPress={() => navigate(ScreenName.DebugExport)}
      />
      <SettingsRow title={"JS Engine"}>
        <Text variant={"body"} fontWeight={"medium"} color={"primary.c80"}>
          {global.HermesInternal ? "Hermes" : "Jsc"}
        </Text>
      </SettingsRow>
    </SettingsNavigationScrollView>
  );
}
