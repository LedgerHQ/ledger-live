import type { FeatureFlagsToolProps } from "./types";

export const FeatureFlags = (props: FeatureFlagsToolProps) => (
  <div>
    <h2>Feature Flags props</h2>
    <p>Overrides: {Object.keys(props.overrides).length}</p>
    <p>Resolved: {Object.keys(props.resolved).length}</p>
    <pre>{JSON.stringify(props.overrides, null, 2)}</pre>
  </div>
);

export default FeatureFlags;
