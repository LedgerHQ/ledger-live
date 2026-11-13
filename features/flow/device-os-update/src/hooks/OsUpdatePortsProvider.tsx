import React, { createContext, useContext, type ReactNode } from "react";
import type { OsUpdatePorts } from "../types/OsUpdatePorts";

const OsUpdatePortsContext = createContext<OsUpdatePorts | null>(null);

export function OsUpdatePortsProvider({
  ports,
  children,
}: Readonly<{ ports: OsUpdatePorts; children: ReactNode }>) {
  return <OsUpdatePortsContext.Provider value={ports}>{children}</OsUpdatePortsContext.Provider>;
}

export function useOsUpdatePorts(): OsUpdatePorts {
  const ports = useContext(OsUpdatePortsContext);
  if (!ports) throw new Error("useOsUpdatePorts must be used inside an OsUpdatePortsProvider");
  return ports;
}
