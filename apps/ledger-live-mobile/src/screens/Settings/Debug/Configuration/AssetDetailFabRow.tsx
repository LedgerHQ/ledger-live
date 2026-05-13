import React, { useCallback } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-env";
import SettingsRow from "~/components/SettingsRow";
import Switch from "~/components/Switch";

const AssetDetailFabRow = () => {
  const enabled = useEnv("DEBUG_ASSET_DETAIL_FAB");
  const toggle = useCallback(() => {
    setEnv("DEBUG_ASSET_DETAIL_FAB", !enabled);
  }, [enabled]);

  return (
    <SettingsRow title="Asset Detail FAB" desc="Show floating button to open BTC Asset Detail">
      <Switch value={enabled} onValueChange={toggle} />
    </SettingsRow>
  );
};

export default AssetDetailFabRow;
