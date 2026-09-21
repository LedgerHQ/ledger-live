import React from "react";
import { useFreezeCardViewModel } from "./useFreezeCardViewModel";
import { Tile } from "./Tile/Tile";

export function Freeze() {
  return <Tile {...useFreezeCardViewModel()} />;
}
