// @flow

import React from "react";

import type { Operation } from "@ledgerhq/live-common/lib/types";
import { useNftMetadata } from "@ledgerhq/live-common/lib/nft";
import { useTheme } from "@react-navigation/native";
import { View, StyleSheet } from "react-native";
import Skeleton from "./Skeleton";
import LText from "./LText";

type Props = {
  style?: Object,
  operation: Operation,
};

const OperationRowNftName = ({ style, operation }: Props) => {
  const { colors } = useTheme();
  const { status, metadata } = useNftMetadata(
    operation.contract,
    operation.tokenId,
  );

  return (
    <View style={style}>
      <Skeleton
        style={[styles.nftName, styles.skeleton]}
        loading={status === "loading"}
      >
        <LText
          style={styles.nftName}
          ellipsizeMode="tail"
          semiBold
          numberOfLines={1}
        >
          {metadata?.nftName || "-"}
        </LText>
      </Skeleton>
      <LText
        style={[
          styles.tokenId,
          {
            color: colors.grey,
          },
        ]}
        ellipsizeMode="middle"
        numberOfLines={1}
      >
        ID {operation.tokenId}
      </LText>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    height: 8,
    width: 120,
    borderRadius: 4,
  },
  nftName: {
    fontSize: 15,
    marginBottom: 4,
  },
  tokenId: {
    fontSize: 12,
  },
});

export default OperationRowNftName;
