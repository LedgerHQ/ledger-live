import { Text } from "@ledgerhq/native-ui";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { View } from "react-native";
import { BaseComposite } from "~/components/RootNavigator/types/helpers";
import { Web3HubStackParamList } from "../../Navigator";
import { ScreenName } from "~/const";

type Props = BaseComposite<NativeStackScreenProps<Web3HubStackParamList, ScreenName.Web3HubTabs>>;

export default function Web3HubTabs(_: Props) {
  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <Text>{ScreenName.Web3HubTabs}</Text>
    </View>
  );
}
