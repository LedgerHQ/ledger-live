import React from "react";
import config from "react-native-config";
import { getEnv } from "@ledgerhq/live-common/env";
import { Icons } from "@ledgerhq/native-ui";
import { useServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import GenerateMockAccounts from "./GenerateMockAccounts";
import GenerateMockAccountsNft from "./GenerateMockAccountsNFTs";
import ImportBridgeStreamData from "./ImportBridgeStreamData";
import GenerateMockAccount from "./GenerateMockAccountsSelect";
import GenerateAnnouncement from "./GenerateAnnouncementMockData";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import Switch from "../../../../components/Switch";
import { toggleMockIncident } from "../__mocks__/serviceStatus";
import SettingsRow from "../../../../components/SettingsRow";

export default function Debugging() {
  const { updateData, incidents } = useServiceStatus();

  return (
    <SettingsNavigationScrollView>
      <GenerateMockAccount />
      <GenerateMockAccounts
        title="Accounts"
        desc="Replace existing accounts with 10 mock accounts from random currencies."
        count={10}
      />
      <GenerateMockAccountsNft
        title="Accounts + NFTs"
        desc="Replace existing accounts with 10 mock accounts with NFTs."
        count={10}
      />
      <GenerateAnnouncement title="Mock a new announcement" />
      {getEnv("MOCK") ? (
        <SettingsRow
          title={"Toggle Service status incident"}
          iconLeft={<Icons.MegaphoneMedium size={24} color="black" />}
        >
          <Switch
            value={incidents.length > 0}
            onValueChange={() => {
              toggleMockIncident();
              updateData();
            }}
          />
        </SettingsRow>
      ) : null}
      <ImportBridgeStreamData
        title="Import .env BRIDGESTREAM_DATA"
        dataStr={config.BRIDGESTREAM_DATA}
      />
    </SettingsNavigationScrollView>
  );
}
