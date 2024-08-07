import React from "react";
import { Skeleton } from "../../Skeleton";
import { Text } from "@ledgerhq/react-ui";

type Props = {
  tokenName: string | string[];
  isLoading: boolean;
};

const TokenTitle: React.FC<Props> = ({ tokenName, isLoading }) => {
  return (
    <Skeleton width={136} minHeight={24} barHeight={10} show={isLoading}>
      <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
        {tokenName}
      </Text>
    </Skeleton>
  );
};

export default TokenTitle;
