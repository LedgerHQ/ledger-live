import React from "react";
import { cn } from "LLD/utils/cn";
import { PnLCard } from "./PnLCard";
import type { PnlViewModel } from "../types";

type Props = Readonly<
  Pick<PnlViewModel, "items"> & {
    direction?: "row" | "col";
  }
>;

export function PnLView({ items, direction = "row" }: Props) {
  const isRow = direction === "row";

  return (
    <div className={cn("flex gap-12", isRow ? "flex-wrap items-stretch" : "flex-col")}>
      {items.map(item => (
        <div key={item.id} className={cn(isRow && "min-w-[12rem] flex-1")}>
          <PnLCard {...item} />
        </div>
      ))}
    </div>
  );
}
