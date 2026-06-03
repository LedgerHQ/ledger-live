import React from "react";
import { useDispatch } from "react-redux";
import SettingsRow from "~/components/SettingsRow";
import Switch from "~/components/Switch";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";

export function RecoverUpsellRow() {
  const dispatch = useDispatch();
  const protectFeature = useFeature("protectServicesMobile");

  if (protectFeature === null || protectFeature === undefined) return null;

  const currentTarget = protectFeature?.params?.protectId;

  const onChange = (enabled: boolean) => {
    if (enabled) {
      dispatch(
        setOverride({
          key: "protectServicesMobile",
          value: {
            ...protectFeature,
            params: { ...protectFeature?.params, protectId: "protect-prod" },
          },
        }),
      );
    } else {
      dispatch(setOverride({ key: "protectServicesMobile", value: undefined }));
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
