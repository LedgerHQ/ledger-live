import React, { type ReactNode } from "react";
import { LinkingProvider } from "@shared/linking";

export function createFakeLinking() {
  const openExternal = jest.fn();

  function LinkingWrapper({ children }: Readonly<{ children: ReactNode }>) {
    return <LinkingProvider config={{ openExternal }}>{children}</LinkingProvider>;
  }

  return { openExternal, LinkingWrapper };
}
