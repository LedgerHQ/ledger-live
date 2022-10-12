import React, { memo } from "react";

import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import {
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { useNftMetadata } from "@ledgerhq/live-common/nft/index";
import { View, StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import Skeleton from "./Skeleton";

type Props = {
  style?: any;
  operation: Operation;
  account: AccountLike;
  parentAccount?: Account | null;
};

const OperationRowNftName = ({
  style,
  operation,
  account,
  parentAccount,
}: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const currency = getAccountCurrency(mainAccount);
  const { status, metadata } = useNftMetadata(
    operation.contract,
    operation.tokenId,
    currency.id,
  );

  return (
    <View style={style}>
      <Skeleton style={styles.skeleton} loading={status === "loading"}>
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

export default memo(OperationRowNftName);
