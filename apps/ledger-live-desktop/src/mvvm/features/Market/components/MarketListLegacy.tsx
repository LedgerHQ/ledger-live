import React from "react";
import { useMarketListVirtualization } from "../hooks/useMarketListVirtualization";
import { useMarket } from "../hooks/useMarket";
import MarketList from "../screens/MarketList";

type MarketListLegacyProps = ReturnType<typeof useMarket>;

export default function MarketListLegacy(props: Readonly<MarketListLegacyProps>) {
  const virtualization = useMarketListVirtualization({
    itemCount: props.itemCount,
    marketData: props.marketData,
    loading: props.loading,
    currenciesLength: props.currenciesLength,
    onLoadNextPage: props.onLoadNextPage,
    checkIfDataIsStaleAndRefetch: props.checkIfDataIsStaleAndRefetch,
  });

  return <MarketList {...props} virtualization={virtualization} />;
}
