import React from "react";
import { Skeleton } from "../../Skeleton";
import { Flex, Text } from "@ledgerhq/react-ui";

type Props = {
  tokenName: string | string[];
  isLoading: boolean;
  collectionName?: string;
};

const TokenTitle: React.FC<Props> = ({ tokenName, isLoading, collectionName }) => {
  return (
    <Skeleton width={136} minHeight={24} barHeight={10} show={isLoading}>
      <Flex flexDirection="column" alignItems="flex-start">
        <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
          {tokenName}
        </Text>
        <Text ff="Inter|SemiBold" color={"opacityDefault.c50"} fontSize={3}>
          {collectionName}
        </Text>
      </Flex>
    </Skeleton>
  );
};

export default TokenTitle;
