import React from "react";
import { logStartupEvent } from "../utils/logStartupTime";

export function WaitForAppReady({
  children,
}: React.PropsWithChildren<{ currencyInitialized: boolean }>) {
  logStartupEvent("WaitForAppReady render");
  logStartupEvent("WaitForAppReady done");
  return children;
}
