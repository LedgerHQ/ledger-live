import { getMainAccount, shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { useBaker } from "@ledgerhq/live-common/families/tezos/bakers";
import invariant from "invariant";
import React, { useCallback } from "react";
import Text from "~/renderer/components/Text";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import { openURL } from "~/renderer/linking";
import { TezosFieldComponentProps } from "./types";

const TezosDelegateValidator = ({
  account,
  parentAccount,
  transaction,
  field,
}: TezosFieldComponentProps) => {
  invariant(transaction.family === "tezos", "tezos transaction");
  const mainAccount = getMainAccount(account, parentAccount);
  const baker = useBaker(transaction.recipient);
  const explorerView = getDefaultExplorerView(mainAccount.currency);
  const bakerURL = getAddressExplorer(explorerView, transaction.recipient);
  const openBaker = useCallback(() => {
    if (bakerURL) openURL(bakerURL);
  }, [bakerURL]);
  return (
    <TransactionConfirmField label={field.label}>
      <Text onClick={openBaker} color="palette.primary.main" ml={1} ff="Inter|Medium" fontSize={3}>
        {baker ? baker.name : shortAddressPreview(transaction.recipient)}
      </Text>
    </TransactionConfirmField>
  );
};

const TezosStorageLimit = ({ transaction, field }: TezosFieldComponentProps) => {
  return (
    <TransactionConfirmField label={field.label}>
      <Text ff="Inter|Medium" color="palette.text.shade80" fontSize={3}>
        {(transaction.storageLimit || "").toString()}
      </Text>
    </TransactionConfirmField>
  );
};

const fieldComponents = {
  "tezos.delegateValidator": TezosDelegateValidator,
  "tezos.storageLimit": TezosStorageLimit,
};
export default {
  fieldComponents,
};
