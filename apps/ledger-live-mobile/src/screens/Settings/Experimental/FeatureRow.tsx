import React from "react";
import { setEnvUnsafe, isEnvDefault, getEnv } from "@ledgerhq/live-common/env";

import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { FeatureId } from "@ledgerhq/types-live";
import { Feature, isReadOnly } from "../../../experimental";
import SettingsRow from "../../../components/SettingsRow";
import FeatureSwitch from "./FeatureSwitch";
import FeatureInteger from "./FeatureInteger";
import FeatureFloat from "./FeatureFloat";

type Props = {
  feature: Feature;
};

const experimentalTypesMap = {
  toggle: FeatureSwitch,
  integer: FeatureInteger,
  float: FeatureFloat,
};

const FeatureRowWithFeatureFlag = ({
  feature,
  featureFlagId,
}: {
  feature: Feature;
  featureFlagId: FeatureId;
}) => {
  const featureFlag = useFeature(featureFlagId);

  return !featureFlag?.enabled ? <FeatureRow feature={feature} /> : null;
};

const FeatureRow = ({ feature }: Props) => {
  const { type, ...rest } = feature;
  const Children = experimentalTypesMap[type];

  // we only display a feature as experimental if it is not enabled already via feature flag
  return (
    <SettingsRow event={`${feature.name}Row`} title={feature.title} desc={feature.description}>
      <Children
        checked={!isEnvDefault(feature.name)}
        readOnly={isReadOnly(feature.name)}
        onChange={setEnvUnsafe}
        isDefault={isEnvDefault(feature.name) || getEnv(feature.name) === undefined}
        {...rest}
        value={getEnv(feature.name)}
      />
    </SettingsRow>
  );
};

const FeatureRowCommon = ({ feature }: Props) =>
  feature.rolloutFeatureFlag ? (
    <FeatureRowWithFeatureFlag feature={feature} featureFlagId={feature.rolloutFeatureFlag} />
  ) : (
    <FeatureRow feature={feature} />
  );

export default FeatureRowCommon;
