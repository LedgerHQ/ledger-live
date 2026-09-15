import React, { type ReactNode } from "react";
import { Freeze } from "../Freeze/Freeze";
import { More } from "../More/More";

export function CardActions({ view }: { readonly view?: ReactNode }) {
  return (
    <div className="flex flex-row gap-8">
      {view}
      <Freeze />
      <More />
    </div>
  );
}
