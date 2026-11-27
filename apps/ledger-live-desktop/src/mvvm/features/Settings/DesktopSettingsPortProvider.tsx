import React, { type ReactNode } from "react";
import { SettingsPortProvider } from "@features/flow-settings";
import { useDesktopSettingsPort } from "./useDesktopSettingsPort";

export function DesktopSettingsPortProvider({ children }: { readonly children: ReactNode }) {
  const port = useDesktopSettingsPort();
  return <SettingsPortProvider value={port}>{children}</SettingsPortProvider>;
}
