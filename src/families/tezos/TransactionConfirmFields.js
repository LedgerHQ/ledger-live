// @flow
import React, { useCallback } from "react";
import { Linking, StyleSheet } from "react-native";
import { useBaker } from "@ledgerhq/live-common/lib/families/tezos/bakers";
import {
  shortAddressPreview,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/lib/explorers";
import { DataRow } from "../../components/ValidateOnDeviceDataRow";
import LText from "../../components/LText";
import colors from "../../colors";

const styles = StyleSheet.create({
  text: {
    color: colors.darkBlue,
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
});

const Pre = ({ account, parentAccount, transaction }: *) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const baker = useBaker(transaction.recipient);
  const explorerView = getDefaultExplorerView(mainAccount.currency);
  const bakerURL = getAddressExplorer(explorerView, transaction.recipient);
  const openBaker = useCallback(() => {
    if (bakerURL) Linking.openURL(bakerURL);
  }, [bakerURL]);

  const isDelegateOperation = transaction.mode === "delegate";

  return (
    <>
      <DataRow label="Source">
        <LText semiBold style={styles.text}>
          {account.freshAddress}
        </LText>
      </DataRow>
      {isDelegateOperation ? (
        <>
          <DataRow label="Validator">
            <LText semiBold onPress={openBaker} style={styles.text}>
              {baker ? baker.name : shortAddressPreview(transaction.recipient)}
            </LText>
          </DataRow>
          <DataRow label="Delegate">
            <LText semiBold style={styles.text}>
              {transaction.recipient}
            </LText>
          </DataRow>
        </>
      ) : null}
    </>
  );
};

const Post = ({ transaction }: *) => (
  <>
    <DataRow label="Storage">
      <LText semiBold style={styles.text}>
        {transaction.storageLimit.toString()}
      </LText>
    </DataRow>
  </>
);

export default {
  pre: Pre,
  post: Post,
};
