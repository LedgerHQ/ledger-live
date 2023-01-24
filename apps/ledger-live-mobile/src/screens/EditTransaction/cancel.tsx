import React from "react";
import { Flex } from "@ledgerhq/native-ui";

import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import { EthereumEditTransactionParamList } from "../../components/RootNavigator/types/EthereumEditTransactionNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import LText from "../../components/LText";

type Props = StackNavigatorProps<
  EthereumEditTransactionParamList,
  ScreenName.CancelTransaction
>;

export function CancelTransaction({ navigation, route }: Props) {
  return (
    <Flex flex={1} color="background.main">
      <TrackScreen
        category="EthereumEditTransaction"
        name="EthereumEditTransaction"
      />
      <Flex p={6}>
        <LText>Hello world</LText>
      </Flex>
    </Flex>
  );
}
