import React from "react";

import { Operation } from "@ledgerhq/live-common/lib/types";
import { useNftMetadata } from "@ledgerhq/live-common/lib/nft";
import { StyleSheet } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import Skeleton from "./Skeleton";

type Props = {
  style?: Object;
  operation: Operation;
};

const OperationRowNftName = ({ style, operation }: Props) => {
  const { status, metadata } = useNftMetadata(
    operation.contract,
    operation.tokenId,
  );

  return (
    <>
      <Skeleton style={[styles.skeleton]} loading={status === "loading"}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          variant="body"
          fontWeight="semiBold"
        >
          {metadata?.nftName || "-"}
        </Text>
      </Skeleton>
      <Text
        variant="paragraph"
        fontWeight="medium"
        color="neutral.c70"
        ellipsizeMode="middle"
        numberOfLines={1}
      >
        ID {operation.tokenId}
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    height: 8,
    width: 120,
    borderRadius: 4,
  },
});

export default OperationRowNftName;
