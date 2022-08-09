import React, { ReactNode } from "react";
import remoteConfig from "@react-native-firebase/remote-config";
import {
  FeatureFlagsProvider,
  defaultFeatures,
} from "@ledgerhq/live-common/featureFlags/index";
import { FeatureId } from "@ledgerhq/types-live";

import { formatFeatureId } from "./FirebaseRemoteConfig";

type Props = {
  children?: ReactNode;
};

const getFeature = (key: FeatureId) => {
  try {
    const value = remoteConfig().getValue(formatFeatureId(key));
    const feature = JSON.parse(value.asString());

    return feature;
  } catch (error) {
    console.error(`Failed to retrieve feature "${key}"`);
    return null;
  }
};

/**
 * @returns all flags that have different defaults are exported as a key value map
 */
export const getAllDivergedFlags = (): { [key in FeatureId]: boolean } => {
  const res: { [key in FeatureId]: boolean } = {};
  Object.keys(defaultFeatures).forEach(key => {
    const value = getFeature(key);
    if (value && value.enabled !== defaultFeatures[key].enabled) {
      res[key] = value.enabled;
    }
  });
  return res;
};

export const FirebaseFeatureFlagsProvider = ({ children }: Props) => (
  <FeatureFlagsProvider getFeature={getFeature}>
    {children}
  </FeatureFlagsProvider>
);
