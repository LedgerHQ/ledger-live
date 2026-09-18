import React from "react";
import { Tile } from "./Tile/Tile";
import { useMoreViewModel } from "./useMoreViewModel";

export function More() {
  const more = useMoreViewModel();

  return more ? <Tile {...more} /> : null;
}
