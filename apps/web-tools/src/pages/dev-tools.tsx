import { ThemeProvider } from "@ledgerhq/lumen-ui-react";
import { DevTools, type DevToolsConfig } from "@devtools/shell";
import { useFeatureFlagsToolProps } from "../hooks/useFeatureFlagsToolProps";

export default function DevToolsPage() {
  const featureFlagsProps = useFeatureFlagsToolProps();
  const config: DevToolsConfig = [{ id: "feature-flags", config: featureFlagsProps }];

  return (
    <ThemeProvider colorScheme="system">
      <div style={{ height: "100vh" }}>
        <DevTools config={config} />
      </div>
    </ThemeProvider>
  );
}
