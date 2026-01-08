import React from "react";
import { useMarketPerformers } from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import type { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { cn } from "../utils/cn";

export const MarketBanner = () => {
  const { data, isLoading, isError } = useMarketPerformers({
    counterCurrency: "usd",
    range: "day",
    limit: 10,
    top: 50,
    sort: "desc", // top gainers
    supported: true,
    refreshRate: 1, // refresh every minute
  });

  if (isLoading) {
    return (
      <div className="mb-16 rounded-md bg-accent p-16 text-white">
        <h3 className="m-0 heading-4-semi-bold">{"📊 Market Top Performers"}</h3>
        <p className="mt-8 body-4">{"Loading..."}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mb-16 rounded-md bg-error p-16 text-white">
        <h3 className="m-0 heading-4-semi-bold">{"⚠️ Market Banner"}</h3>
        <p className="mt-8 body-4">{"Failed to load market data"}</p>
      </div>
    );
  }

  return (
    <div className="mb-16 rounded-md bg-muted">
      <h3 className="mb-12 heading-4-semi-bold">{"🚀 Top Gainers (24h)"}</h3>
      <div className="flex flex-wrap gap-16">
        {data?.slice(0, 4).map((coin: MarketItemPerformer) => (
          <div
            key={coin.id}
            className="bg-white/15 flex-1 basis-[150px] rounded-md p-12 backdrop-blur-sm"
          >
            <div className="mb-8 flex items-center gap-8">
              {coin.image && (
                <img src={coin.image} alt={coin.name} className="size-24 rounded-full" />
              )}
              <div>
                <div className="body-3-semi-bold">{coin.ticker}</div>
                <div className="opacity-80 body-4">{coin.name}</div>
              </div>
            </div>
            <div className="body-2-semi-bold">${coin.price.toFixed(2)}</div>
            <div
              className={cn(
                "body-3-semi-bold",
                coin.priceChangePercentage24h >= 0 ? "text-success" : "text-error",
              )}
            >
              {coin.priceChangePercentage24h >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(coin.priceChangePercentage24h).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 opacity-80 body-4">
        {"🔥 Hot Reload is working! • Data refreshes every minute"}
      </div>
    </div>
  );
};
