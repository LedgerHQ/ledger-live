import React from "react";
import config from "react-native-config";
import { getEnv } from "@ledgerhq/live-common/env";
import GenerateMockAccounts from "./GenerateMockAccounts";
import GenerateMockAccountsNft from "./GenerateMockAccountsNFTs";
import ImportBridgeStreamData from "./ImportBridgeStreamData";
import GenerateMockAccount from "./GenerateMockAccountsSelect";
import GenerateAnnouncement from "./GenerateAnnouncementMockData";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import ToggleServiceStatusIncident from "./ToggleServiceStatus";

export default function Generators() {
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
      {getEnv("MOCK") ? <ToggleServiceStatusIncident /> : null}
      <ImportBridgeStreamData
        title="Import .env BRIDGESTREAM_DATA"
        dataStr={config.BRIDGESTREAM_DATA}
      />
    </SettingsNavigationScrollView>
  );
}
