import { useMemo } from "react";
import { DevTools } from "@devtools/shell";
import { FEATURE_FLAGS_ID } from "@devtools/core";
import { getToolLoaders } from "@devtools/registry";
import { useFeatureFlagsToolProps } from "../hooks/useFeatureFlagsToolProps";

const TOOL_IDS = new Set([FEATURE_FLAGS_ID]);

export default function DevToolsPage() {
  const toolLoaders = useMemo(() => getToolLoaders(TOOL_IDS), []);
  const featureFlagsProps = useFeatureFlagsToolProps();

  const devToolsProps = useMemo(
    () => ({ [FEATURE_FLAGS_ID]: featureFlagsProps }),
    [featureFlagsProps],
  );

  return (
    <div style={{ height: "100vh" }}>
      <DevTools toolLoaders={toolLoaders} toolProps={devToolsProps} />
    </div>
  );
}
