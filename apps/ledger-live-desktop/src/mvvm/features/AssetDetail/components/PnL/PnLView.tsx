import React from "react";
import { PnLCard } from "LLD/features/PnL/components/PnLCard";
import type { PnlViewModel } from "./types";

type Props = Readonly<Pick<PnlViewModel, "items">>;

export function PnLView({ items }: Props) {
  return (
    <div className="flex gap-12">
      {items.map(item => (
        <PnLCard key={item.id} {...item} />
      ))}
    </div>
  );
}
