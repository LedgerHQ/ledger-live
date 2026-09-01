import React, { useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Spinner } from "@ledgerhq/lumen-ui-rnative";
import { useHederaValidators } from "@ledgerhq/live-common/families/hedera/react";
import type { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import type { Account } from "@ledgerhq/types-live";
import ValidatorRow from "./ValidatorRow";
import ValidatorsFetchError from "./ValidatorsFetchError";

type Props = {
  account: Account;
  searchQuery: string;
  onItemPress: (validator: HederaValidator) => void;
  header?: React.ReactNode;
};

const keyExtractor = (v: HederaValidator) => v.id;

export default function ValidatorsList({
  account,
  searchQuery,
  onItemPress,
  header,
}: Readonly<Props>) {
  const queryValidators = useHederaValidators(account.currency.id, searchQuery);
  const validators = queryValidators.validators;

  const renderItem = useCallback(
    (data: { item: HederaValidator }) => (
      <ValidatorRow account={account} validator={data.item} onPress={onItemPress} />
    ),
    [onItemPress, account],
  );

  if (queryValidators.loading) {
    return (
      <View style={styles.center}>
        <Spinner size={32} />
      </View>
    );
  }

  return (
    <>
      {header}
      {!!queryValidators.error && <ValidatorsFetchError error={queryValidators.error} />}
      <FlatList
        contentContainerStyle={styles.list}
        data={validators}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
