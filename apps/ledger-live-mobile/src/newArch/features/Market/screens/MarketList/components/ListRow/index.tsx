import React from "react";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import MarketRowItem from "LLM/features/Market/components/MarketRowItem";
import { CurrencyData } from "@ledgerhq/live-common/market/types";

interface ListRowProps {
  item: CurrencyData;
  index: number;
  counterCurrency?: string;
  range?: string;
  selectCurrency: (id?: string, data?: CurrencyData, range?: string) => void;
}
function ListRow({ item, index, counterCurrency, range, selectCurrency }: ListRowProps) {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => {
        selectCurrency(item.id, item, range);
        navigation.navigate(ScreenName.MarketDetail, {
          currencyId: item.id,
        });
      }}
    >
      <MarketRowItem item={item} index={index} counterCurrency={counterCurrency} />
    </TouchableOpacity>
  );
}

export default ListRow;
