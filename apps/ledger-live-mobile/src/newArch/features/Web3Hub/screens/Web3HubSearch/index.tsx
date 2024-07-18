import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useContext } from "react";
import { ScrollView } from "react-native";
import { BaseComposite } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { Web3HubStackParamList } from "LLM/features/Web3Hub/Navigator";
import { HeaderContext } from "LLM/features/Web3Hub/HeaderContext";
import ManifestsList from "LLM/features/Web3Hub/components/ManifestsList";
import SearchList from "./components/SearchList";

type Props = BaseComposite<NativeStackScreenProps<Web3HubStackParamList, ScreenName.Web3HubSearch>>;

export default function Web3HubSearch({ navigation }: Props) {
  const { search } = useContext(HeaderContext);

  return (
    <ScrollView
      style={{
        flex: 1,
      }}
    >
      {search ? (
        <SearchList navigation={navigation} search={search} />
      ) : (
        <ManifestsList navigation={navigation} />
      )}
    </ScrollView>
  );
}
