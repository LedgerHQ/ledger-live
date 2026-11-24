import React, { type ReactNode } from "react";
import { NewSettingsView } from "./NewSettingsView";
import { useNewSettingsViewModel } from "./useNewSettingsViewModel";

type NewSettingsRouteProps = Readonly<{ legacySettings: ReactNode }>;

export function NewSettingsRoute({ legacySettings }: NewSettingsRouteProps) {
  const { showLegacySettings, selectedSection, onSelectSection, rowsToHide } =
    useNewSettingsViewModel();

  if (showLegacySettings) return <>{legacySettings}</>;

  return (
    <NewSettingsView
      selectedSection={selectedSection}
      onSelectSection={onSelectSection}
      rowsToHide={rowsToHide}
    />
  );
}
