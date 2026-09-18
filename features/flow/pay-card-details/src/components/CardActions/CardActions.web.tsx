import React from "react";
import { Freeze } from "../Freeze/Freeze";
import { More } from "../More/More";
import { Reveal } from "../Reveal/Reveal";
import type { RevealTileProps } from "../../types";

type CardActionsProps = Readonly<{
  reveal?: RevealTileProps | null;
}>;

export function CardActions({ reveal }: CardActionsProps) {
  return (
    <div className="flex flex-row gap-8">
      {reveal ? <Reveal {...reveal} /> : null}
      <div className="min-w-0 flex-1">
        <Freeze />
      </div>
      <div className="min-w-0 flex-1">
        <More />
      </div>
    </div>
  );
}
