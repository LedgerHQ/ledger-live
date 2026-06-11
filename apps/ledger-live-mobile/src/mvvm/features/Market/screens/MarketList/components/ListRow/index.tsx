import React from "react";
import { TouchableOpacity } from "react-native";
import MarketRowItem from "LLM/features/Market/components/MarketRowItem";
import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { useAssetDetailNavigation } from "LLM/features/AssetDetail/hooks/useAssetDetailNavigation";

interface ListRowProps {
  item: MarketCurrencyData;
  index: number;
  counterCurrency?: string;
  range?: string;
}
function ListRow({ item, index, counterCurrency, range }: ListRowProps) {
  const { openFromMarket } = useAssetDetailNavigation();
  return (
    <TouchableOpacity
      onPress={() => {
        openFromMarket({
          marketCurrencyId: item.id,
          ledgerCurrencyIds: item.ledgerIds,
          source: "market",
        });
      }}
    >
      <MarketRowItem item={item} index={index} counterCurrency={counterCurrency} range={range} />
    </TouchableOpacity>
  );
}

export default ListRow;
