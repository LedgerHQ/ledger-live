import React, { useCallback, useState } from "react";
import Switch from "~/renderer/components/Switch";
import { setEnvUnsafe, getEnv } from "@ledgerhq/live-env";
import { useNftAPI } from "@ledgerhq/live-nft-react";

const PRODUCTION_URL = "https://nft.api.live.ledger.com";
const STAGING_URL = "https://nft.api.live.ledger-test.com";

type Pros = {
  onChange?: (url: string) => void;
};

const EnableStagingNftMetadataServiceToggle = ({ onChange }: Pros) => {
  const currentUrlValue = getEnv("NFT_METADATA_SERVICE");

  const { clearCache } = useNftAPI();

  const [stagingNftMetadataService, setStagingNftMetadataService] = useState(
    currentUrlValue === STAGING_URL,
  );

  const handleChange = useCallback(
    (enabled: boolean) => {
      setStagingNftMetadataService(enabled);
      setEnvUnsafe("NFT_METADATA_SERVICE", enabled ? STAGING_URL : PRODUCTION_URL);
      onChange?.(enabled ? STAGING_URL : PRODUCTION_URL);
      clearCache();
    },
    [clearCache, onChange],
  );

  return (
    <>
      <Switch
        isChecked={stagingNftMetadataService}
        onChange={handleChange}
        data-testid="settings-enable-staging-nft-metadata-service"
      />
    </>
  );
};

export default EnableStagingNftMetadataServiceToggle;
