import React, { useCallback } from "react";
import { Linking, TouchableOpacity } from "react-native";

import { getAddressExplorer } from "@ledgerhq/live-common/explorers";

import { ExplorerView } from "@ledgerhq/types-cryptoassets";

import { Box, BoxedIcon, Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { MedalMedium, TrophyMedium } from "@ledgerhq/native-ui/assets/icons";
import { SuperRepresentative } from "@ledgerhq/live-common/families/tron/types";
import Clock from "~/icons/Clock";

type Props = {
  validator?: SuperRepresentative | null;
  address: string;
  amount: number;
  duration?: React.ReactNode;
  explorerView?: ExplorerView;
  isSR: boolean;
  isLast?: boolean;
};

const Row = ({ validator, address, amount, duration, explorerView, isSR }: Props) => {
  const { colors } = useTheme();
  const srURL = explorerView && getAddressExplorer(explorerView, address);

  const openSR = useCallback(() => {
    if (srURL) Linking.openURL(srURL);
  }, [srURL]);

  return (
    <Flex flexDirection={"column"} alignItems={"center"} py={4}>
      <Flex flexDirection={"row"} alignItems={"center"}>
        <Box mr={4}>
          <BoxedIcon Icon={isSR ? TrophyMedium : MedalMedium} />
        </Box>
        <Flex
          flexDirection={"column"}
          alignItems={"flex-start"}
          justifyContent={"flex-end"}
          flex={1}
        >
          <TouchableOpacity onPress={openSR}>
            <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1} pb={2}>
              {validator ? validator.name : address}
            </Text>
          </TouchableOpacity>
          <Flex flexDirection={"row"} alignItems={"center"}>
            <Clock size={12} color={colors.neutral.c80} />
            <Text variant={"paragraph"} color={"neutral.c80"} ml={2}>
              {duration}
            </Text>
          </Flex>
        </Flex>
        <Flex flexDirection={"column"} alignItems={"center"}>
          <Text variant={"paragraph"} color={"neutral.c80"} ml={2}>
            {amount}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Row;
