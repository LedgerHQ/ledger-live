import React from "react";
import { Icons, Flex, ProgressLoader, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import Circle from "../../Circle";

type Props = {
  appName: string;
  isActive?: boolean;
  installed?: boolean;
  itemProgress?: number;
  i: number;
};

const Item = ({ appName, isActive, installed, itemProgress, i }: Props) => {
  const { colors } = useTheme();
  return (
    <Flex key={appName} flexDirection={"row"} alignItems="center" mb={4}>
      <Circle size={40} bg={colors.neutral.c30}>
        {isActive ? (
          <ProgressLoader
            progress={itemProgress}
            infinite={!itemProgress || itemProgress === 1}
            radius={12}
            strokeWidth={3}
          />
        ) : installed ? (
          <Icons.CheckAloneMedium size={22} color={"success.c100"} />
        ) : (
          <Text color="neutral.c100" variant="body">
            {i + 1}
          </Text>
        )}
      </Circle>
      <Text ml={3} variant="paragraphLineHeight" textTransform="capitalize">
        {appName}
      </Text>
    </Flex>
  );
};

export default Item;
