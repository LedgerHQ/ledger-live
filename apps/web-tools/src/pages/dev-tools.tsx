import { useMemo } from "react";
import { ThemeProvider } from "@ledgerhq/lumen-ui-react";
import { DevTools, type DevToolsConfig } from "@devtools/shell";
import { useFeatureFlagsToolProps } from "@devtools/bindings";
import { buildTransport, buildCopyStoreProtocol, combineProtocols } from "@devtools/wire";
import { store } from "../store";
import { sleepingListener } from "../store/sleepingListener";

// Use 127.0.0.1 (not "localhost") to match the relay's IPv4 bind — on macOS
const HUB_URL = "ws://127.0.0.1:9090";
const ROLE = "tool" as const;

export const wire = buildTransport(
  { hubUrl: HUB_URL, role: ROLE, id: "web-tools", target: "desktop" },
  combineProtocols(buildCopyStoreProtocol(store, sleepingListener, ROLE)),
);

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
