import { Text } from "@ledgerhq/native-ui";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { BaseComposite } from "~/components/RootNavigator/types/helpers";
import SafeAreaView from "~/components/SafeAreaView";
import { Web3HubStackParamList } from "../../Navigator";
import { ScreenName } from "~/const";

type Props = BaseComposite<NativeStackScreenProps<Web3HubStackParamList, ScreenName.Web3HubTabs>>;

export default function Web3HubTabs(_: Props) {
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
      <Text>{ScreenName.Web3HubTabs}</Text>
    </SafeAreaView>
  );
}
