import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView } from "react-native";
import { BaseComposite } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { Web3HubStackParamList } from "../../Navigator";
import ManifestList from "LLM/features/Web3Hub/components/ManifestsList";

type Props = BaseComposite<NativeStackScreenProps<Web3HubStackParamList, ScreenName.Web3HubSearch>>;

export default function Web3HubSearch({ navigation }: Props) {
  return (
    <ScrollView
      style={{
        flex: 1,
      }}
    >
      <ManifestList navigation={navigation} />
    </ScrollView>
  );
}
