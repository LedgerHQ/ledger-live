import React from "react";
import { Flex, SelectableList } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";

import { ScreenName } from "../../../const";
import { TrackScreen } from "../../../analytics";
import { EthereumEditTransactionParamList } from "../../../components/RootNavigator/types/EthereumEditTransactionNavigator";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";

type Props = StackNavigatorProps<
  EthereumEditTransactionParamList,
  ScreenName.EditEthereumTransactionMethodSelection
>;

export function MethodSelection({ navigation, route }: Props) {
  const options = [
    { i18nKey: "editTransaction.speedUp", value: "speedUp" },
    { i18nKey: "common.cancel", value: "cancel" },
  ] as const;

  const { operation, account, parentAccount } = route.params;

  const onSelect = (option: typeof options[number]["value"]) => {
    switch (option) {
      case "cancel":
        navigation.navigate(ScreenName.CancelTransaction, {
          operation,
          account,
          parentAccount,
        });
        break;
      case "speedUp":
        navigation.navigate(ScreenName.SpeedUpTransaction, {
          operation,
          account,
          parentAccount,
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
                <Trans i18nKey={editOption.i18nKey} />
              </SelectableList.Element>
            );
          })}
        </SelectableList>
      </Flex>
    </Flex>
  );
}
