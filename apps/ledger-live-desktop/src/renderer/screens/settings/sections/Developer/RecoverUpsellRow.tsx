import React from "react";
import { useFeature, useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import Switch from "~/renderer/components/Switch";

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
    <Row
      title="Ledger Recover deeplinks environment"
      desc={`Enable the production mode of the Legacy Recover Feature Flag to have access to prod deeplinks, in dev or staging builds (current env is "${currentTarget}")`}
    >
      <Switch isChecked={currentTarget === "protect-prod"} onChange={onChange} />
    </Row>
  );
}
