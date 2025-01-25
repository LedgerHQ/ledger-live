import React from "react";
import { Skeleton } from "../../Skeleton";
import { Flex, Text } from "@ledgerhq/react-ui";

type Props = {
  tokenName: string | string[];
  isLoading: boolean;
  collectionName?: string;
  complementaryData?: string;
};

const TokenTitle: React.FC<Props> = ({
  tokenName,
  isLoading,
  collectionName,
  complementaryData,
}) => {
  const isInsideRareSatRow = Boolean(complementaryData);
  return (
    <Skeleton width={136} minHeight={24} barHeight={10} show={isLoading}>
      <Flex flexDirection="column" alignItems="flex-start">
        <Text
          ff="Inter|SemiBold"
          color="palette.text.shade100"
          fontSize={isInsideRareSatRow ? 3 : 4}
        >
          {tokenName}
        </Text>
        <Text
          ff="Inter|SemiBold"
          color={"opacityDefault.c50"}
          fontSize={isInsideRareSatRow ? 2 : 3}
        >
          {collectionName || complementaryData}
        </Text>
      </Flex>
    </Skeleton>
  );
};

export default TokenTitle;
