import React from "react";
import { SuccessKaraokeView } from "./SuccessKaraokeView";
import {
  useSuccessKaraokeViewModel,
  type SuccessKaraokeScreenProps,
} from "./useSuccessKaraokeViewModel";

export type { SuccessKaraokeScreenProps } from "./useSuccessKaraokeViewModel";

export function SuccessKaraokeScreen(props: SuccessKaraokeScreenProps) {
  const viewModel = useSuccessKaraokeViewModel(props);
  return <SuccessKaraokeView {...viewModel} />;
}
