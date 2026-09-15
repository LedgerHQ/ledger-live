import React, { type ReactNode } from "react";
import { Freeze } from "../Freeze/Freeze";
import { More } from "../More/More";

export function CardActions({ children }: { readonly children?: ReactNode }) {
  return (
    <div className="flex flex-row gap-8">
      {children}
      <div className="min-w-0 flex-1">
        <Freeze />
      </div>
      <div className="min-w-0 flex-1">
        <More />
      </div>
    </div>
  );
}
