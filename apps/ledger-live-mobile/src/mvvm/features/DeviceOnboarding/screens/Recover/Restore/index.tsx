import React from "react";
import { RecoverRestoreView } from "./RecoverRestoreView";
import {
  useRecoverRestoreViewModel,
  type RecoverRestoreScreenProps,
} from "./useRecoverRestoreViewModel";

export type { RecoverRestoreScreenProps } from "./useRecoverRestoreViewModel";

export function RecoverRestoreScreen(props: RecoverRestoreScreenProps) {
  const viewModel = useRecoverRestoreViewModel(props);
  return <RecoverRestoreView {...viewModel} />;
}
