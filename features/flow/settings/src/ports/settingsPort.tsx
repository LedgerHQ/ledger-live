import React, { createContext, useContext, type ReactNode } from "react";
import { SettingsPortMissing } from "./errors";
import type { AnySettingsPort, SettingKey, SettingsPort, SettingsValues } from "./types";

const SettingsPortContext = createContext<AnySettingsPort | null>(null);

export function SettingsPortProvider({
  value,
  children,
}: {
  readonly value: AnySettingsPort;
  readonly children: ReactNode;
}) {
  return <SettingsPortContext.Provider value={value}>{children}</SettingsPortContext.Provider>;
}

/**
 * The port the app provides, typed for the section that reads it. The app provides one port that
 * carries the values and updates of every section, so a section names its own port type.
 */
export function useSettingsPort<Port extends AnySettingsPort = SettingsPort>(): Port {
  const port = useContext(SettingsPortContext);
  if (!port) {
    throw new SettingsPortMissing();
  }
  return port as Port;
}

export function useSetting<K extends SettingKey>(key: K): SettingsValues[K] {
  return useSettingsPort().values[key];
}

export function useUpdateSetting(): SettingsPort["setValue"] {
  return useSettingsPort().setValue;
}
