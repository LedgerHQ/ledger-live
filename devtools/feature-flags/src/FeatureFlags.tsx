import { useToolProps } from "@devtools/shell";
import { FEATURE_FLAGS_ID } from "./constants";

export const FeatureFlags = () => {
  const props = useToolProps(FEATURE_FLAGS_ID);
  if (!props) return null;

  return (
    <div>
      <h2>Feature Flags props</h2>
      <p>Overrides: {Object.keys(props.overrides).length}</p>
      <p>Resolved: {Object.keys(props.resolved).length}</p>
      <pre>{JSON.stringify(props.overrides, null, 2)}</pre>
    </div>
  );
};
