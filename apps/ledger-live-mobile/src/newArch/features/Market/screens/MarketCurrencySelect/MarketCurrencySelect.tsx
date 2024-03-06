import { SearchInput } from "@ledgerhq/native-ui";
import React, { memo, useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, TextInput, StyleSheet } from "react-native";
import Search from "~/components/Search";
import SafeAreaView from "~/components/SafeAreaView";
import EmptyList from "./components/EmptyList";
import RowItem, { type Item } from "./components/RowItem";

interface MarketCurrencySelectProps {
  items: Item[];
  onSelectCurrency: (value: string) => void;
  counterCurrency?: string;
}

function MarketCurrencySelect({
  items,
  onSelectCurrency,
  counterCurrency,
}: MarketCurrencySelectProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const ref = useRef<TextInput | null>(null);

  useEffect(() => {
    ref?.current?.focus?.();
  }, [ref]);

  return (
    <SafeAreaView edges={["left", "right"]} isFlex style={styles.root}>
      <SearchInput placeholder={t("common.search")} value={search} onChange={setSearch} ref={ref} />

      <Search
        fuseOptions={{
          threshold: 0.1,
          keys: ["value", "label"],
          shouldSort: false,
        }}
        value={search}
        items={items}
        render={(list: typeof items) => (
          <FlatList
            data={list}
            renderItem={({ item, index }: { item: (typeof items)[number]; index: number }) => (
              <RowItem
                item={item}
                index={index}
                onSelectCurrency={onSelectCurrency}
                counterCurrency={counterCurrency}
              />
            )}
            keyExtractor={(item, index) => item.value + index}
          />
        )}
        // This props is badly type
        renderEmptySearch={() => <EmptyList search={search} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    margin: 10,
  },
});

export default memo(MarketCurrencySelect);
