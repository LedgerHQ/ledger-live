import React from "react";
import type { AssetManagementProps } from "./AssetManagement.types";
import { AssetManagementView } from "./AssetManagementView";
import { useAssetManagementViewModel } from "./useAssetManagementViewModel";

/** The Asset management section of the new Settings: reads and changes the settings through the app port. */
export function AssetManagement(props: AssetManagementProps) {
  return <AssetManagementView {...useAssetManagementViewModel(props)} />;
}
