import React, { createContext, useContext, type ReactNode } from "react";
import { SettingsPortMissing } from "./errors";
import type { SettingKey, SettingsPort, SettingsValues } from "./types";

const SettingsPortContext = createContext<SettingsPort | null>(null);

export function SettingsPortProvider({
  value,
  children,
}: {
  readonly value: SettingsPort;
  readonly children: ReactNode;
}) {
  return <SettingsPortContext.Provider value={value}>{children}</SettingsPortContext.Provider>;
}

function useSettingsPort(): SettingsPort {
  const port = useContext(SettingsPortContext);
  if (!port) {
    throw new SettingsPortMissing();
  }
  return port;
}

export function useSetting<K extends SettingKey>(key: K): SettingsValues[K] {
  return useSettingsPort().values[key];
}

export function useUpdateSetting(): SettingsPort["setValue"] {
  return useSettingsPort().setValue;
}
