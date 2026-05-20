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
  return (
    <div className={cn("flex gap-12", direction === "col" && "flex-col")}>
      {items.map(item => (
        <PnLCard key={item.id} {...item} />
      ))}
    </div>
  );
}
