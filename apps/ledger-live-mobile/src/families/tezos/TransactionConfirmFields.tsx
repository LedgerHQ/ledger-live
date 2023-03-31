import invariant from "invariant";
import React, { useCallback } from "react";
import { Linking, StyleSheet } from "react-native";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { useBaker } from "@ledgerhq/live-common/families/tezos/bakers";
import {
  shortAddressPreview,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/explorers";
import { toLocaleString } from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "react-redux";
import { DataRow } from "../../components/ValidateOnDeviceDataRow";
import LText from "../../components/LText";
import { localeSelector } from "../../reducers/settings";

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
});

const TezosStorageLimit = ({ transaction }: { transaction: Transaction }) => {
  const locale = useSelector(localeSelector);
  invariant(transaction.family === "tezos", "tezos transaction");
  return (
    <DataRow label="Storage Limit">
      <LText semiBold style={styles.text}>
        {transaction.storageLimit
          ? toLocaleString(transaction.storageLimit, locale)
          : ""}
      </LText>
    </DataRow>
  );
};

const TezosDelegateValidator = ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const baker = useBaker(transaction.recipient);
  const explorerView = getDefaultExplorerView(mainAccount.currency);
  const bakerURL = getAddressExplorer(explorerView, transaction.recipient);
  const openBaker = useCallback(() => {
    if (bakerURL) Linking.openURL(bakerURL);
  }, [bakerURL]);
  invariant(transaction.family === "tezos", "tezos transaction");
  return (
    <DataRow label="Validator">
      <LText semiBold onPress={openBaker} style={styles.text}>
        {baker ? baker.name : shortAddressPreview(transaction.recipient)}
      </LText>
    </DataRow>
  );
};

const fieldComponents = {
  "tezos.delegateValidator": TezosDelegateValidator,
  "tezos.storageLimit": TezosStorageLimit,
};
export default {
  fieldComponents,
};
