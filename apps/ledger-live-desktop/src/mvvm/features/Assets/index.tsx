import React from "react";
import { AssetsView } from "./AssetsView";
import { useAssetsViewModel } from "./hooks/useAssetsViewModel";

const Assets = () => <AssetsView {...useAssetsViewModel()} />;

export default Assets;
