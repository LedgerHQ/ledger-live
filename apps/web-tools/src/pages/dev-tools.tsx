import { ThemeProvider } from "@ledgerhq/lumen-ui-react";
import { DevTools, type DevToolsConfig } from "@devtools/shell";
import { useFeatureFlagsToolProps } from "../hooks/useFeatureFlagsToolProps";
import { useCurrenciesToolProps } from "../hooks/useCurrenciesToolProps";

export default function DevToolsPage() {
  const featureFlagsProps = useFeatureFlagsToolProps();
  const currenciesProps = useCurrenciesToolProps();
  const config: DevToolsConfig = [
    { id: "feature-flags", config: featureFlagsProps },
    { id: "currencies", config: currenciesProps },
  ];

  return (
    <ThemeProvider colorScheme="system">
      <div style={{ height: "100vh" }}>
        <DevTools config={config} />
      </div>
    </ThemeProvider>
  );
}
