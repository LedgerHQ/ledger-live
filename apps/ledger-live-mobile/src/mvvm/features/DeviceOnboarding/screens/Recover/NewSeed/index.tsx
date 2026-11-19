import React from "react";
import { RecoverNewSeedView } from "./RecoverNewSeedView";
import {
  useRecoverNewSeedViewModel,
  type RecoverNewSeedScreenProps,
} from "./useRecoverNewSeedViewModel";

export type { RecoverNewSeedScreenProps } from "./useRecoverNewSeedViewModel";

export function RecoverNewSeedScreen(props: RecoverNewSeedScreenProps) {
  const viewModel = useRecoverNewSeedViewModel(props);
  return <RecoverNewSeedView {...viewModel} />;
}
