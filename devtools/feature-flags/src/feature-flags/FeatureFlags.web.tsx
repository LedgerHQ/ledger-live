import { FlagList } from "../components";
import type { FeatureFlagsToolProps } from "../types";

export const FeatureFlags = (props: FeatureFlagsToolProps) => (
  <div>
    <FlagList {...props} />
  </div>
);

export default FeatureFlags;
