import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { LifeRing } from "@ledgerhq/lumen-ui-react/symbols";

const nbTiles = 3;
export function ActionsList() {
  return (
    <div className="flex gap-8 justify-between" data-testid="my-wallet-actions-list">
      {Array.from({ length: nbTiles }).map((_, index) => (
        <TileButton key={index} icon={LifeRing} className="flex-1">
          {index + 1}
        </TileButton>
      ))}
    </div>
  );
}
