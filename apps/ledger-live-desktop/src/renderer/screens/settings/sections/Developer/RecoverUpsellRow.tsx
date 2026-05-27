import React from "react";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
import { useDispatch } from "LLD/hooks/redux";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import { Switch } from "@ledgerhq/lumen-ui-react";

export function RecoverUpsellRow() {
  const dispatch = useDispatch();
  const protectFeature = useFeature("protectServicesDesktop");

  if (protectFeature === null || protectFeature === undefined) return null;

  const currentTarget = protectFeature?.params?.protectId;

  const onChange = (enabled: boolean) => {
    if (enabled) {
      dispatch(
        setOverride({
          key: "protectServicesDesktop",
          value: {
            ...protectFeature,
            params: { ...protectFeature?.params, protectId: "protect-prod" },
          },
        }),
      );
    } else {
      dispatch(setOverride({ key: "protectServicesDesktop", value: undefined }));
    }
  };

  return (
    <Row
      title="Ledger Recover deeplinks environment"
      desc={`Enable the production mode of the Legacy Recover Feature Flag to have access to prod deeplinks, in dev or staging builds (current env is "${currentTarget}")`}
    >
      <Switch selected={currentTarget === "protect-prod"} onChange={onChange} />
    </Row>
  );
}
