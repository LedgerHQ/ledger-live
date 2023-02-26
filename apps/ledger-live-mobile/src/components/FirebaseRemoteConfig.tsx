import React, { ReactNode, useEffect, useState } from "react";
import remoteConfig from "@react-native-firebase/remote-config";
import { defaultFeatures } from "@ledgerhq/live-common/featureFlags/index";
import { reduce, snakeCase } from "lodash";
import { DefaultFeatures } from "@ledgerhq/types-live";

export const formatToFirebaseFeatureId = (id: string) =>
  `feature_${snakeCase(id)}`;

// Firebase SDK treat JSON values as strings
const formatDefaultFeatures = (config: DefaultFeatures) =>
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

export const FirebaseRemoteConfigProvider = ({
  children,
}: Props): JSX.Element | null => {
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    let unmounted = false;
    const loadRemoteConfig = async () => {
      try {
        await remoteConfig().setDefaults({
          ...formatDefaultFeatures(defaultFeatures),
        });
        await remoteConfig().fetchAndActivate();
      } catch (error) {
        if (!unmounted) {
          console.error(
            `Failed to fetch Firebase remote config with error: ${error}`,
          );
        }
      }
      if (!unmounted) {
        setLoaded(true);
      }
    };
    loadRemoteConfig();

    return () => {
      unmounted = true;
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return <>{children}</>;
};
