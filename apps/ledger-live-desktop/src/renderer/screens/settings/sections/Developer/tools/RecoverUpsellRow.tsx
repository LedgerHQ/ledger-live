import React from "react";
import { useFeature, useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { Switch } from "@ledgerhq/lumen-ui-react";
import DeveloperClassicRow from "../components/DeveloperClassicRow";

export function RecoverUpsellRow() {
  const { overrideFeature, resetFeature } = useFeatureFlags();

  const protectFeature = useFeature("protectServicesDesktop");

  if (protectFeature === null || protectFeature === undefined) return null;

  const currentTarget = protectFeature?.params?.protectId;

  const onChange = (enabled: boolean) => {
    if (enabled) {
      overrideFeature("protectServicesDesktop", {
        ...protectFeature,
        params: { ...protectFeature?.params, protectId: "protect-prod" },
      });
    } else {
      resetFeature("protectServicesDesktop");
    }
  };

  return (
    <DeveloperClassicRow
      title="Ledger Recover deeplinks environment"
      desc={`Enable the production mode of the Legacy Recover Feature Flag to have access to prod deeplinks, in dev or staging builds (current env is "${currentTarget}")`}
    >
      <Switch selected={currentTarget === "protect-prod"} onChange={onChange} />
    </DeveloperClassicRow>
  );
}
