import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

export function MarketDataStatRowSkeletons({
  count,
  rowClassName = "h-36 w-full rounded-8",
}: Readonly<{
  count: number;
  rowClassName?: string;
}>) {
  return (
    <div className="flex flex-col gap-8 pt-8" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={rowClassName} />
      ))}
    </div>
  );
}
