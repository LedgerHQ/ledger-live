import React from "react";
import { useTranslation } from "react-i18next";
import { IconsLegacy, Flex, ProgressLoader, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import Circle from "../../Circle";

export enum ItemState {
  Installed,
  Skipped,
  Active,
  Idle,
}

type Props = {
  appName: string;
  itemProgress?: number;
  productName: string;
  state: ItemState;
  i: number;
};

const Item = ({ appName, state, itemProgress, productName, i }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Flex key={appName} flexDirection={"row"} alignItems="center" mb={4}>
      <Circle size={40} bg={colors.neutral.c30}>
        {state === ItemState.Active ? (
          <ProgressLoader
            progress={itemProgress}
            infinite={!itemProgress || itemProgress === 1}
            radius={10}
            strokeWidth={2}
          />
        ) : state === ItemState.Installed ? (
          <IconsLegacy.CheckAloneMedium size={20} color={"success.c50"} />
        ) : state === ItemState.Skipped ? (
          <IconsLegacy.InfoAltMedium size={20} color={"neutral.c100"} />
        ) : (
          <Text color="neutral.c100" variant="body">
            {i + 1}
          </Text>
        )}
      </Circle>
      <Flex flexDirection="column">
        <Text ml={3} fontSize={3}>
          {appName}
        </Text>
        {state === ItemState.Skipped ? (
          <Text ml={3} color="neutral.c70" fontSize={2}>
            {t("installSetOfApps.ongoing.skipped", { productName })}
          </Text>
        ) : null}
      </Flex>
    </Flex>
  );
};

export default Item;
