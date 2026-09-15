import React from "react";
import { Tile } from "./Tile/Tile";
import type { RevealTileProps } from "../../types";

export function Reveal(props: RevealTileProps) {
  return (
    <div className="min-w-0 flex-1">
      <Tile {...props} />
    </div>
  );
}
