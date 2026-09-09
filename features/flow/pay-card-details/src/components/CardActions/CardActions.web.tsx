import React from "react";
import { Freeze } from "../Freeze/Freeze";
import { More } from "../More/More";

export function CardActions() {
  return (
    <div className="flex flex-row gap-8">
      <Freeze />
      <More />
    </div>
  );
}
