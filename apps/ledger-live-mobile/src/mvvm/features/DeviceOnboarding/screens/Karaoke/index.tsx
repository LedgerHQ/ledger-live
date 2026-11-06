import React from "react";
import { KaraokeView } from "./KaraokeView";
import { useKaraokeViewModel } from "./useKaraokeViewModel";

type KaraokeScreenProps = Readonly<{
  onClose: () => void;
}>;

export function KaraokeScreen({ onClose }: KaraokeScreenProps) {
  const viewModel = useKaraokeViewModel({ onClose });
  return <KaraokeView {...viewModel} />;
}
