import React, { ReactNode, useEffect, useState } from "react";
import remoteConfig from "@react-native-firebase/remote-config";
import { defaultFeatures } from "@ledgerhq/live-common/featureFlags/index";
import { reduce, snakeCase } from "lodash";
import { FeatureId, DefaultFeatures } from "@ledgerhq/types-live";

export const formatFeatureId = (id: FeatureId) => `feature_${snakeCase(id)}`;

// Firebase SDK treat JSON values as strings
const formatDefaultFeatures = (config: DefaultFeatures) =>
  reduce(
    config,
    (acc, feature, featureId) => ({
      ...acc,
      [formatFeatureId(featureId as FeatureId)]: JSON.stringify(feature),
    }),
    {},
  );

type Props = {
  children?: ReactNode;
};

export const FirebaseRemoteConfigProvider = ({
  children,
}: Props): JSX.Element | null => {
  const [loaded, setLoaded] = useState<boolean>(false);

  const loadRemoteConfig = async () => {
    try {
      await remoteConfig().setDefaults({
        ...formatDefaultFeatures(defaultFeatures),
      });
      await remoteConfig().fetchAndActivate();
    } catch (error) {
      console.error(
        `Failed to fetch Firebase remote config with error: ${error}`,
      );
    }
    setLoaded(true);
  };

  useEffect(() => {
    loadRemoteConfig();
  }, []);

  if (!loaded) {
    return null;
  }

  return <>{children}</>;
};
