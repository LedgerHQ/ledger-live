import React from "react";
import { AssetsView } from "./AssetsView";
import { useAssetsViewModel } from "./hooks/useAssetsViewModel";
import type { AssetsProps } from "./types";

const Assets = ({ afterCryptosSection }: AssetsProps) => (
  <AssetsView {...useAssetsViewModel()} afterCryptosSection={afterCryptosSection} />
);

export default Assets;
