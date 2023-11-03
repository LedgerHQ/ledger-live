import React, { ReactNode, useEffect, useState } from "react";
import remoteConfig from "@react-native-firebase/remote-config";
import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/index";
import { reduce, snakeCase } from "lodash";
import { FeatureMap } from "@ledgerhq/types-live";

export const formatToFirebaseFeatureId = (id: string) => {
  return `feature_${snakeCase(id)}`;
};

// Firebase SDK treat JSON values as strings
const formatDefaultFeatures = (config: FeatureMap) =>
  reduce(
    config,
    (acc, feature, featureId) => ({
      ...acc,
      [formatToFirebaseFeatureId(featureId)]: JSON.stringify(feature),
    }),
    {},
  );

type Props = {
  children?: ReactNode;
};

export const FirebaseRemoteConfigProvider = ({ children }: Props): JSX.Element | null => {
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    let unmounted = false;
    const fetchConfig = async () => {
      try {
        if (__DEV__) {
          remoteConfig().setConfigSettings({ minimumFetchIntervalMillis: 0 });
        }
        await remoteConfig().setDefaults({
          ...formatDefaultFeatures(DEFAULT_FEATURES),
        });
        await remoteConfig().fetchAndActivate();
      } catch (error) {
        if (!unmounted) {
          console.error(`Failed to fetch Firebase remote config with error: ${error}`);
        }
      }
      if (!unmounted) {
        setLoaded(true);
      }
    };
    fetchConfig();

    return () => {
      unmounted = true;
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return <>{children}</>;
};
