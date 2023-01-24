import React from "react";
import { Flex, SelectableList } from "@ledgerhq/native-ui";

import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import { EthereumEditTransactionParamList } from "../../components/RootNavigator/types/EthereumEditTransactionNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";

type Props = StackNavigatorProps<
  EthereumEditTransactionParamList,
  ScreenName.EditTransactionOptions
>;

export function MethodSelection({ navigation, route }: Props) {
  const options = [
    { text: "Speed up", value: "speedUp" },
    { text: "Cancel", value: "cancel" },
  ] as const;

  const { operation } = route.params;

  const onSelect = (option: typeof options[number]["value"]) => {
    switch (option) {
      case "cancel":
        navigation.navigate(ScreenName.CancelTransaction, {
          operation,
        });
        break;
      case "speedUp":
        navigation.navigate(ScreenName.SpeedUpTransaction, {
          operation,
        });
        break;
      default:
        break;
    }
  };

  return (
    <Flex flex={1} color="background.main">
      <TrackScreen
        category="EthereumEditTransaction"
        name="EthereumEditTransaction"
      />
      <Flex p={6}>
        <SelectableList onChange={onSelect}>
          {options.map(editOption => {
            return (
              <SelectableList.Element value={editOption.value}>
                {editOption.text}
              </SelectableList.Element>
            );
          })}
        </SelectableList>
      </Flex>
    </Flex>
  );
}
