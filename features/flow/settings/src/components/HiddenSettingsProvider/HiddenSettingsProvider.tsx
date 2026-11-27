import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import { getHiddenSettings, type SettingId } from "../../logic/hiddenSettings";

const NO_HIDDEN_SETTINGS: ReadonlySet<SettingId> = new Set();

const HiddenSettingsContext = createContext<ReadonlySet<SettingId>>(NO_HIDDEN_SETTINGS);

type HiddenSettingsProviderProps = Readonly<{
  rowsToHide: unknown;
  children: ReactNode;
}>;

export function HiddenSettingsProvider({ rowsToHide, children }: HiddenSettingsProviderProps) {
  const hiddenSettings = useMemo(() => getHiddenSettings(rowsToHide), [rowsToHide]);
  return (
    <HiddenSettingsContext.Provider value={hiddenSettings}>
      {children}
    </HiddenSettingsContext.Provider>
  );
}

export function useIsSettingHidden(settingId: SettingId | undefined): boolean {
  const hiddenSettings = useContext(HiddenSettingsContext);
  return settingId !== undefined && hiddenSettings.has(settingId);
}
