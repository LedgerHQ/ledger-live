import { Flex, Text } from "@ledgerhq/react-ui";
import React from "react";

type CardProps = {
  collectionName: string;
  contract: string;
  tokenId: number;
  totalStats: number;
};
export const SatsCard = ({ collectionName, contract, tokenId, totalStats }: CardProps) => {
  return (
    <Flex
      p={5}
      backgroundColor="opacityDefault.c05"
      borderRadius={"8px"}
      justifyContent="space-between"
      flexDirection="column"
    >
      <Flex height={32} width={32} bg={"red"}></Flex>

      <Text variant="body" fontWeight="semiBold" color="neutral.c100" mt={"10px"}>
        {collectionName}
      </Text>

      <Flex flexDirection="column" mt={"10px"}>
        <Flex flexDirection={"row"} justifyContent="space-between" alignItems={"center"}>
          <Text variant="small" fontWeight="medium" color="neutral.c100">
            {contract}
          </Text>

          <Text variant="small" fontWeight="medium" color="neutral.c70">
            {tokenId}
          </Text>
        </Flex>

        <Text variant="small" fontWeight="medium" color="neutral.c70">
          {totalStats} stats
        </Text>
      </Flex>
    </Flex>
  );
};
