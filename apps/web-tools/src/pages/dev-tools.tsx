import { DevTools } from "@devtools/shell";
import { registerFeatureFlagsTool, FEATURE_FLAGS_ID } from "@devtools/feature-flags";
import { useFeatureFlagsToolProps } from "../hooks/useFeatureFlagsToolProps";

registerFeatureFlagsTool();

export default function DevToolsPage() {
  const featureFlagsProps = useFeatureFlagsToolProps();

  return (
    <div style={{ height: "100vh" }}>
      <DevTools toolProps={{ [FEATURE_FLAGS_ID]: featureFlagsProps }} />
    </div>
  );
}
