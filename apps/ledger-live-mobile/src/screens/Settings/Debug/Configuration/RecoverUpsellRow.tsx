import React from "react";
import SettingsRow from "~/components/SettingsRow";
import Switch from "~/components/Switch";
import { useFeature, useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";

export function RecoverUpsellRow() {
  const { overrideFeature, resetFeature } = useFeatureFlags();

  const protectFeature = useFeature("protectServicesMobile");

  if (protectFeature === null || protectFeature === undefined) return null;

  const currentTarget = protectFeature?.params?.protectId;

  const onChange = (enabled: boolean) => {
    if (enabled) {
      overrideFeature("protectServicesMobile", {
        ...protectFeature,
        params: { ...protectFeature?.params, protectId: "protect-prod" },
      });
    } else {
      resetFeature("protectServicesMobile");
    }
  };

  return (
    <SettingsRow
      title="Ledger Recover deeplinks environment"
      desc={`Enable the production mode of Recover to have access to prod deeplinks, in dev or staging builds (current env is "${currentTarget}")`}
    >
      <Switch value={currentTarget === "protect-prod"} onValueChange={onChange} />
    </SettingsRow>
  );
}
