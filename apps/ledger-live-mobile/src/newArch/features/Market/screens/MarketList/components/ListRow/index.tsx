import React from "react";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import MarketRowItem from "LLM/features/Market/components/MarketRowItem";
import { CurrencyData } from "@ledgerhq/live-common/market/utils/types";

interface ListRowProps {
  item: CurrencyData;
  index: number;
  counterCurrency?: string;
  range?: string;
}
function ListRow({ item, index, counterCurrency, range }: ListRowProps) {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate(ScreenName.MarketDetail, {
          currencyId: item.id,
        });
      }}
    >
      <MarketRowItem item={item} index={index} counterCurrency={counterCurrency} range={range} />
    </TouchableOpacity>
  );
}

export default ListRow;
