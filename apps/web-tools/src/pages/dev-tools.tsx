import { DevTools } from "@devtools/shell";
import { FEATURE_FLAGS_ID } from "@devtools/shell/src/toolIds";
import { useFeatureFlagsToolProps } from "../hooks/useFeatureFlagsToolProps";

export default function DevToolsPage() {
  const featureFlagsProps = useFeatureFlagsToolProps();

  return (
    <div style={{ height: "100vh" }}>
      <DevTools toolProps={{ [FEATURE_FLAGS_ID]: featureFlagsProps }} />
    </div>
  );
}
