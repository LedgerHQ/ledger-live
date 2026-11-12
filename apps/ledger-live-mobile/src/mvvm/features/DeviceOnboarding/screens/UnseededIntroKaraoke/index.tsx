import React from "react";
import { UnseededIntroKaraokeView } from "./UnseededIntroKaraokeView";
import {
  useUnseededIntroKaraokeViewModel,
  type UnseededIntroKaraokeScreenProps,
} from "./useUnseededIntroKaraokeViewModel";

export type { UnseededIntroKaraokeScreenProps } from "./useUnseededIntroKaraokeViewModel";

export function UnseededIntroKaraokeScreen(props: UnseededIntroKaraokeScreenProps) {
  const viewModel = useUnseededIntroKaraokeViewModel(props);
  return <UnseededIntroKaraokeView {...viewModel} />;
}
