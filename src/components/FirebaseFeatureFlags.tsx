import React, { ReactNode } from "react";
import remoteConfig from "@react-native-firebase/remote-config";
import { FeatureFlagsProvider } from "@ledgerhq/live-common/lib/featureFlags";
import { FeatureId } from "@ledgerhq/live-common/lib/types";

import { formatFeatureId } from "./FirebaseRemoteConfig";

type Props = {
  children?: ReactNode;
};

export const FirebaseFeatureFlagsProvider = ({ children }: Props) => {
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

  return (
    <FeatureFlagsProvider getFeature={getFeature}>
      {children}
    </FeatureFlagsProvider>
  );
};
