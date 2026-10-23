import React from "react";
import { AssetsView } from "./AssetsView";
import { useAssetsViewModel } from "./hooks/useAssetsViewModel";
import type { AssetsProps } from "./types";

function Assets({ afterCryptosSection }: AssetsProps) {
  return <AssetsView {...useAssetsViewModel()} afterCryptosSection={afterCryptosSection} />;
}

export default Assets;
