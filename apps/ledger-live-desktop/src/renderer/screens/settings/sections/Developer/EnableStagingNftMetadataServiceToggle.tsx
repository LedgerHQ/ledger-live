import React, { useCallback, useState } from "react";
import Switch from "~/renderer/components/Switch";
import { setEnvUnsafe, getEnv } from "@ledgerhq/live-common/env";
import { useNftAPI } from "@ledgerhq/live-common/nft/NftMetadataProvider/index";

const PRODUCTION_URL = "https://nft.api.live.ledger.com";
const STAGING_URL = "https://nft.api.live.ledger-stg.com";

const EnableStagingNftMetadataServiceToggle = () => {
  const currentUrlValue = getEnv("NFT_ETH_METADATA_SERVICE");

  const { clearCache } = useNftAPI();

  const [stagingNftMetadataService, setStagingNftMetadataService] = useState(
    currentUrlValue === STAGING_URL,
  );

  const handleChange = useCallback(
    (enabled: boolean) => {
      setStagingNftMetadataService(enabled);
      setEnvUnsafe("NFT_ETH_METADATA_SERVICE", enabled ? STAGING_URL : PRODUCTION_URL);
      clearCache();
    },
    [clearCache],
  );

  return (
    <>
      <Switch
        isChecked={stagingNftMetadataService}
        onChange={handleChange}
        data-test-id="settings-enable-staging-nft-metadata-service"
      />
    </>
  );
};

export default EnableStagingNftMetadataServiceToggle;
