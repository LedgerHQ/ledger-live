import React, { useContext } from "react";
import { View } from "react-native";
import type { SearchProps } from "LLM/features/Web3Hub/types";
import { HeaderContext } from "LLM/features/Web3Hub/HeaderContext";
import ManifestsList from "LLM/features/Web3Hub/components/ManifestsList";
import SearchList from "./components/SearchList";

export default function Web3HubSearch({ navigation }: SearchProps) {
  const { search } = useContext(HeaderContext);

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      {search ? (
        <SearchList navigation={navigation} search={search} />
      ) : (
        <ManifestsList navigation={navigation} />
      )}
    </View>
  );
}
