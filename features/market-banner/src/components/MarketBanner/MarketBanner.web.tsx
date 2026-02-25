import React from "react";

export function MarketBanner() {
  return (
    <div className="flex items-center justify-between rounded-lg bg-error p-16">
      <div className="flex flex-col gap-4">
        <span className="body-2-semi-bold text-base">{"Market Banner"}</span>
        <span className="body-3 text-muted">{"Discover the market"}</span>
      </div>
    </div>
  );
}
