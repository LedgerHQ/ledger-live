import React, { PropsWithChildren, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import isEqual from "lodash/isEqual";
import remoteConfig from "@react-native-firebase/remote-config";
import {
  FeatureFlagsProvider,
  defaultFeatures,
} from "@ledgerhq/live-common/featureFlags/index";
import { FeatureId, Feature } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-common/env";

import { formatFeatureId } from "./FirebaseRemoteConfig";

import { languageSelector } from "../reducers/settings";

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = PropsWithChildren<{}>;

const getFeature = (args: {
  key: FeatureId;
  appLanguage: string;
  localOverrides?: { [key in FeatureId]?: Feature };
  allowOverride?: boolean;
}) => {
  const { key, appLanguage, localOverrides, allowOverride = true } = args;
  try {
    // Nb prioritize local overrides
    if (allowOverride && localOverrides && localOverrides[key]) {
      return localOverrides[key];
    }

    const envFlags = getEnv("FEATURE_FLAGS") as
      | { [key in FeatureId]?: Feature }
      | undefined;

    if (allowOverride && envFlags) {
      const feature = envFlags[key];
      if (feature)
        return {
          ...feature,
          overridesRemote: true,
          overriddenByEnv: true,
        };
    }

    const value = remoteConfig().getValue(formatFeatureId(key));
    const feature = JSON.parse(value.asString());

    if (
      feature.enabled &&
      ((feature.languages_whitelisted &&
        !feature.languages_whitelisted.includes(appLanguage)) ||
        (feature.languages_blacklisted &&
          feature.languages_blacklisted.includes(appLanguage)))
    ) {
      return {
        enabledOverriddenForCurrentLanguage: true,
        ...feature,
        enabled: false,
      };
    }

    return feature;
  } catch (error) {
    console.error(`Failed to retrieve feature "${key}"`);
    return null;
  }
};

/**
 * @returns all flags that have different defaults are exported as a key value map
 */
export const getAllDivergedFlags = (
  appLanguage: string,
): { [key in FeatureId]: boolean } => {
  const res: { [key in FeatureId]: boolean } = {};
  (Object.keys(defaultFeatures) as FeatureId[]).forEach(key => {
    const value = getFeature({ key, appLanguage });
    if (value && value.enabled !== defaultFeatures[key].enabled) {
      res[key] = value.enabled;
    }
  });
  return res;
};

export const FirebaseFeatureFlagsProvider: React.FC<Props> = ({ children }) => {
  const [localOverrides, setLocalOverrides] = useState({});

  const appLanguage = useSelector(languageSelector);

  const overrideFeature = useCallback(
    (key: FeatureId, value: Feature): void => {
      const actualRemoteValue = getFeature({
        key,
        appLanguage,
        allowOverride: false,
      });
      if (!isEqual(actualRemoteValue, value)) {
        const { overriddenByEnv: _, ...pureValue } = value;
        const overridenValue = { ...pureValue, overridesRemote: true };
        setLocalOverrides(currentOverrides => ({
          ...currentOverrides,
          [key]: overridenValue,
        }));
      } else {
        setLocalOverrides(currentOverrides => ({
          ...currentOverrides,
          [key]: undefined,
        }));
      }
    },
    [appLanguage],
  );

  const resetFeature = (key: FeatureId): void => {
    setLocalOverrides(currentOverrides => ({
      ...currentOverrides,
      [key]: undefined,
    }));
  };

  // Nb wrapped because the method is also called from outside.
  const wrappedGetFeature = useCallback(
    (key: FeatureId): Feature =>
      getFeature({ key, appLanguage, localOverrides }),
    [localOverrides, appLanguage],
  );

  return (
    <FeatureFlagsProvider
      getFeature={wrappedGetFeature}
      overrideFeature={overrideFeature}
      resetFeature={resetFeature}
    >
      {children}
    </FeatureFlagsProvider>
  );
};
