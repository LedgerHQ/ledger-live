/* @flow */
import React from "react";
import { setEnvUnsafe, isEnvDefault } from "@ledgerhq/live-common/lib/env";

import type { Feature } from "../../../experimental";
import { isReadOnly } from "../../../experimental";
import SettingsRow from "../../../components/SettingsRow";
import FeatureSwitch from "./FeatureSwitch";
import FeatureInteger from "./FeatureInteger";

type Props = {
  feature: Feature,
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
      title={type === "integer" ? `${feature.title}` : feature.title}
      desc={feature.description}
      onPress={null}
      alignedTop
    >
      <Children
        checked={!isEnvDefault(feature.name)}
        readOnly={isReadOnly(feature.name)}
        onChange={setEnvUnsafe}
        {...rest}
      />
    </SettingsRow>
  );
};

export default FeatureRow;
