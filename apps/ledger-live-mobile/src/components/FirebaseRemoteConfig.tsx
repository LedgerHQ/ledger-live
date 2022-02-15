import { ReactNode, useEffect } from "react";
import remoteConfig from "@react-native-firebase/remote-config";
import { defaultFeatures } from "@ledgerhq/live-common/lib/featureFlags";
import { reduce } from "lodash";
import { FeatureId, DefaultFeatures } from "@ledgerhq/live-common/lib/types";

export const formatFeatureId = (id: FeatureId) => `feature_${id}`;

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

export const FirebaseRemoteConfigProvider = ({ children }: Props) => {
  useEffect(() => {
    const fetchConfig = async () => {
      await remoteConfig().setDefaults({
        ...formatDefaultFeatures(defaultFeatures),
      });
      await remoteConfig().fetchAndActivate();
    };
    fetchConfig();
  }, []);

  return children;
};
