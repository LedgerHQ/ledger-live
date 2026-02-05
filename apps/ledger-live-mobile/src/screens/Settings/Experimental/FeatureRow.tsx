import React from "react";
import { setEnvUnsafe, isEnvDefault, getEnv } from "@ledgerhq/live-env";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { FeatureId } from "@ledgerhq/types-live";
import { Feature, isReadOnly } from "../../../experimental";
import SettingsRow from "~/components/SettingsRow";
import FeatureSwitch from "./FeatureSwitch";
import FeatureInteger from "./FeatureInteger";
import FeatureFloat from "./FeatureFloat";
import { useTranslation } from "~/context/Locale";

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

const FeatureRow = ({
  feature,
  onChangeOverride,
}: Props & { onChangeOverride?: (name: string, value: unknown) => void }) => {
  const { type, ...rest } = feature;
  const Children = experimentalTypesMap[type];
  const { t } = useTranslation();
  const handleChange = (name: string, value: unknown): boolean => {
    if (onChangeOverride) {
      onChangeOverride(name, value);
      return true;
    }
    setEnvUnsafe(name, value);
    return true;
  };
  // we only display a feature as experimental if it is not enabled already via feature flag
  return (
    <SettingsRow
      event={`${feature.name}Row`}
      title={t(feature.title)}
      desc={t(feature.description)}
    >
      <Children
        checked={!isEnvDefault(feature.name)}
        readOnly={isReadOnly(feature.name)}
        onChange={handleChange}
        isDefault={isEnvDefault(feature.name) || getEnv(feature.name) === undefined}
        {...rest}
        value={getEnv(feature.name) as number}
      />
    </SettingsRow>
  );
};

const ForceProviderFeatureRow = ({ feature }: Props) => {
  const dmk = useDeviceManagementKit();

  const onChangeOverride = (name: string, value: unknown) => {
    if (dmk && typeof value === "number") {
      dmk.setProvider(value);
    }
    setEnvUnsafe(name, value);
  };

  return <FeatureRow feature={feature} onChangeOverride={onChangeOverride} />;
};

const PluckProviderFeatureRow = (feature: Feature) => {
  switch (feature.name) {
    case "FORCE_PROVIDER":
      return <ForceProviderFeatureRow key={feature.name} feature={feature} />;
    default:
      return <FeatureRow key={feature.name} feature={feature} />;
  }
};

const FeatureRowCommon = ({ feature }: Props) =>
  feature.rolloutFeatureFlag ? (
    <FeatureRowWithFeatureFlag feature={feature} featureFlagId={feature.rolloutFeatureFlag} />
  ) : (
    PluckProviderFeatureRow(feature)
  );

export default FeatureRowCommon;
