import { Text } from "@ledgerhq/native-ui";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { View } from "react-native";
import { BaseComposite } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { Web3HubStackParamList } from "../../Navigator";

type Props = BaseComposite<NativeStackScreenProps<Web3HubStackParamList, ScreenName.Web3HubApp>>;

export default function Web3HubApp({ route }: Props) {
  const { manifestId } = route.params;
  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <Text>{ScreenName.Web3HubApp}</Text>
      <Text>{manifestId}</Text>
    </View>
  );
}
