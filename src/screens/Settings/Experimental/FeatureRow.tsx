import React from "react";
import {
  setEnvUnsafe,
  isEnvDefault,
  getEnv,
} from "@ledgerhq/live-common/lib/env";

import { Feature, isReadOnly } from "../../../experimental";
import SettingsRow from "../../../components/SettingsRow";
import FeatureSwitch from "./FeatureSwitch";
import FeatureInteger from "./FeatureInteger";

type Props = {
  feature: Feature;
};

const experimentalTypesMap = {
  toggle: FeatureSwitch,
  integer: FeatureInteger,
};

const FeatureRow = ({ feature }: Props) => {
  const { type, ...rest } = feature;
  const Children = experimentalTypesMap[type];
  return (
    <SettingsRow
      event={`${feature.name}Row`}
      title={feature.title}
      desc={feature.description}
    >
      <Children
        checked={!isEnvDefault(feature.name)}
        readOnly={isReadOnly(feature.name)}
        onChange={setEnvUnsafe}
        isDefault={
          isEnvDefault(feature.name) || getEnv(feature.name) === undefined
        }
        {...rest}
        value={getEnv(feature.name)}
      />
    </SettingsRow>
  );
};

export default FeatureRow;
