import React, { useCallback, useState } from "react";
import { Switch } from "@ledgerhq/native-ui";
import { setEnvUnsafe, getEnv } from "@ledgerhq/live-env";
import { useNftAPI } from "@ledgerhq/live-nft-react";

import SettingsRow from "~/components/SettingsRow";

const PRODUCTION_URL = "https://nft.api.live.ledger.com";
const STAGING_URL = "https://nft.api.live.ledger-test.com";

const NftMetadataServiceRow = () => {
  const currentUrlValue = getEnv("NFT_METADATA_SERVICE");

  const { clearCache } = useNftAPI();

  const [stagingNftMetadataService, setStagingNftMetadataService] = useState(
    currentUrlValue === STAGING_URL,
  );

  const onChange = useCallback(
    (enabled: boolean) => {
      setStagingNftMetadataService(enabled);
      setEnvUnsafe("NFT_METADATA_SERVICE", enabled ? STAGING_URL : PRODUCTION_URL);
      clearCache();
    },
    [clearCache],
  );

  return (
    <>
      <SettingsRow
        event="NftMetadataServiceRow"
        title="Staging NFT metadata service"
        desc="Toggle the staging Ethereum NFT metadata service and clear local cache"
      >
        <Switch checked={stagingNftMetadataService} onChange={onChange} />
      </SettingsRow>
    </>
  );
};

export default NftMetadataServiceRow;
