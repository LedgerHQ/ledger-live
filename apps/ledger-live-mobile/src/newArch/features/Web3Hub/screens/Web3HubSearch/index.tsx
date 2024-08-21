import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SearchProps } from "LLM/features/Web3Hub/types";
import useScrollHandler from "LLM/features/Web3Hub/hooks/useScrollHandler";
import ManifestsList from "LLM/features/Web3Hub/components/ManifestsList";
import SearchList from "./components/SearchList";
import Header, { TOTAL_HEADER_HEIGHT } from "./components/Header";

const edges = ["top", "bottom", "left", "right"] as const;

export default function Web3HubSearch({ navigation }: SearchProps) {
  const [search, setSearch] = useState("");
  const { layoutY, scrollHandler } = useScrollHandler(TOTAL_HEADER_HEIGHT);

  // Reset the layoutY value when search changes
  useEffect(() => {
    layoutY.value = 0;
  }, [layoutY, search]);

  return (
    <SafeAreaView edges={edges} style={{ flex: 1 }}>
      <Header navigation={navigation} onSearch={setSearch} layoutY={layoutY} />
      <View
        style={{
          flex: 1,
        }}
      >
        {search ? (
          <SearchList
            navigation={navigation}
            search={search}
            onScroll={scrollHandler}
            pt={TOTAL_HEADER_HEIGHT}
          />
        ) : (
          <ManifestsList
            navigation={navigation}
            onScroll={scrollHandler}
            pt={TOTAL_HEADER_HEIGHT}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
