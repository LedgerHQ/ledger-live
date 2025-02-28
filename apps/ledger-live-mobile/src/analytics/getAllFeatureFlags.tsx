import {
  formatToFirebaseFeatureId,
  DEFAULT_FEATURES,
} from "@ledgerhq/live-common/featureFlags/index";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

export function getAllFeatureFlags() {
  const featureKeys = Object.keys(DEFAULT_FEATURES);
  console.log(`>>> featureKeys: `, featureKeys);
  const flagsArr = featureKeys.map(key =>
    LiveConfig.getValueByKey(formatToFirebaseFeatureId(key)).toJSON(),
  );
  console.log(`>>> `, flagsArr);
  const flags = Object.fromEntries(flagsArr.map((flag, index) => [featureKeys[index], flag]));
  console.log(`>>> flags: `, flags);
  return flags;
}
