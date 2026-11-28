import React, { type ReactNode } from "react";
import { OsUpdatePortsProvider } from "@features/flow-device-os-update";
import { useOsUpdatePortsAdapter } from "./useOsUpdatePortsAdapter";

/** Mounts the mobile ports for the debug screens, which render the flow outside its route. */
export function WithOsUpdatePorts({ children }: Readonly<{ children: ReactNode }>) {
  const ports = useOsUpdatePortsAdapter();
  if (!ports) return null;
  return <OsUpdatePortsProvider ports={ports}>{children}</OsUpdatePortsProvider>;
}
