// @flow

import React, { useCallback } from "react";
import { FlatList } from "react-native";
import type { TokenAccount } from "@ledgerhq/live-common/lib/types";
import LText from "../../components/LText";
import Touchable from "../../components/Touchable";

const TokenAccountItem = ({
  account,
  onAccountPress,
}: {
  account: TokenAccount,
  onAccountPress: TokenAccount => *,
}) => {
  const onPress = useCallback(() => onAccountPress(account), [
    account,
    onAccountPress,
  ]);
  return (
    <Touchable event="TokenAccountRow" onPress={onPress}>
      <LText
        bold
        style={{
          // FIXME OBVIOUSLY this is temporary
          padding: 10,
          color: "red",
        }}
      >
        {account.token.name}
      </LText>
    </Touchable>
  );
};

const keyExtractor = o => o.id;

const TokenAccountsList = ({
  tokenAccounts,
  onAccountPress,
}: {
  tokenAccounts: TokenAccount[],
  onAccountPress: TokenAccount => *,
}) => {
  const renderItem = useCallback(
    ({ item }) => (
      <TokenAccountItem account={item} onAccountPress={onAccountPress} />
    ),
    [],
  );
  return (
    <FlatList
      data={tokenAccounts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
    />
  );
};

export default TokenAccountsList;
