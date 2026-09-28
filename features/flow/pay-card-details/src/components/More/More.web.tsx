import React from "react";
import { Tile } from "./Tile/Tile";
import { useMoreViewModel } from "./useMoreViewModel";
import type { CardSettingsActions } from "./types";

export function More(actions: CardSettingsActions) {
  const more = useMoreViewModel(actions);

  return more ? <Tile {...more} /> : null;
}
