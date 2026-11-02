import React, { createContext, useContext, type ReactNode } from "react";
import { AssetsTablePortsMissing } from "./errors";
import type { AssetsTablePorts } from "./ports";

const AssetsTablePortsContext = createContext<AssetsTablePorts | null>(null);

export function AssetsTablePortsProvider({
  value,
  children,
}: {
  readonly value: AssetsTablePorts;
  readonly children: ReactNode;
}) {
  return (
    <AssetsTablePortsContext.Provider value={value}>{children}</AssetsTablePortsContext.Provider>
  );
}

export function useAssetsTablePorts(): AssetsTablePorts {
  const ports = useContext(AssetsTablePortsContext);
  if (!ports) {
    throw new AssetsTablePortsMissing();
  }
  return ports;
}
