/* @flow */
import React from "react";
import { setEnvUnsafe, isEnvDefault } from "@ledgerhq/live-common/lib/env";

import type { Feature } from "../../../experimental";
import { isReadOnly } from "../../../experimental";
import SettingsRow from "../../../components/SettingsRow";
import FeatureSwitch from "./FeatureSwitch";

type Props = {
  feature: Feature,
};

const experimentalTypesMap = {
  toggle: FeatureSwitch,
};

const FeatureRow = ({ feature }: Props) => {
  const { type, ...rest } = feature;
  const Children = experimentalTypesMap[type];
  return (
    <SettingsRow
      event={`${feature.name}Row`}
      title={feature.title}
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
