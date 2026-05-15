import { useMemo } from "react";
import { DevTools, setupDevTools } from "@devtools/shell";
import { registerFeatureFlagsTool, FEATURE_FLAGS_ID } from "@devtools/feature-flags";
import { useFeatureFlagsToolProps } from "../hooks/useFeatureFlagsToolProps";

setupDevTools([registerFeatureFlagsTool]);

export default function DevToolsPage() {
  const featureFlagsProps = useFeatureFlagsToolProps();

  const devToolsProps = useMemo(
    () => ({ [FEATURE_FLAGS_ID]: featureFlagsProps }),
    [featureFlagsProps],
  );

  return (
    <div style={{ height: "100vh" }}>
      <DevTools toolProps={devToolsProps} />
    </div>
  );
}
