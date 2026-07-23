import { useMemo } from "react";
import { ThemeProvider } from "@ledgerhq/lumen-ui-react";
import { DevTools, type DevToolsConfig } from "@devtools/shell";
import { useFeatureFlagsToolProps } from "@devtools/bindings";

export default function DevToolsPage() {
  const featureFlagsProps = useFeatureFlagsToolProps();
  const config: DevToolsConfig = useMemo(
    () => [{ id: "feature-flags", config: featureFlagsProps }],
    [featureFlagsProps],
  );

  return (
    <ThemeProvider colorScheme="system">
      <div style={{ height: "100vh" }}>
        <DevTools config={config} />
      </div>
    </ThemeProvider>
  );
}
