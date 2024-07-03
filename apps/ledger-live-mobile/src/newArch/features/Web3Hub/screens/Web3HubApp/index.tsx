import { Text } from "@ledgerhq/native-ui";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { BaseComposite } from "~/components/RootNavigator/types/helpers";
import SafeAreaView from "~/components/SafeAreaView";
import { ScreenName } from "~/const";
import { Web3HubStackParamList } from "../../Navigator";

type Props = BaseComposite<NativeStackScreenProps<Web3HubStackParamList, ScreenName.Web3HubApp>>;

export default function Web3HubApp({ route }: Props) {
  const { manifestId } = route.params;
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      isFlex
      style={{
        flexDirection: "column",
        gap: 26,
        marginHorizontal: 24,
        marginTop: 114,
      }}
    >
      <Text>{ScreenName.Web3HubApp}</Text>
      <Text>{manifestId}</Text>
    </SafeAreaView>
  );
}
