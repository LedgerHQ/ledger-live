import React from "react";
import { UnseededSuccessKaraokeView } from "./UnseededSuccessKaraokeView";
import {
  useUnseededSuccessKaraokeViewModel,
  type UnseededSuccessKaraokeScreenProps,
} from "./useUnseededSuccessKaraokeViewModel";

export type { UnseededSuccessKaraokeScreenProps } from "./useUnseededSuccessKaraokeViewModel";
export { UnseededSuccessKaraokeView } from "./UnseededSuccessKaraokeView";

export function UnseededSuccessKaraokeScreen(props: UnseededSuccessKaraokeScreenProps) {
  const viewModel = useUnseededSuccessKaraokeViewModel(props);
  return <UnseededSuccessKaraokeView {...viewModel} />;
}
