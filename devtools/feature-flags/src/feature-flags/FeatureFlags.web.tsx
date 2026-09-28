import { FlagList } from "../components";
import type { FeatureFlagsToolProps } from "../types";

const FeatureFlags = (props: FeatureFlagsToolProps) => (
  <div>
    <FlagList {...props} />
  </div>
);

export default FeatureFlags;
