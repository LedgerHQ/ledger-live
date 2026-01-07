import { getMainAccount, shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import React, { useCallback } from "react";
import Text from "~/renderer/components/Text";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import { openURL } from "~/renderer/linking";
import { useBaker } from "~/renderer/react/hooks";
import { StakingFieldComponentProps } from "./types";

const DelegateValidator = ({
  account,
  parentAccount,
  transaction,
  field,
}: StakingFieldComponentProps) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const baker = useBaker(transaction.recipient);
  const explorerView = getDefaultExplorerView(mainAccount.currency);
  const bakerURL = getAddressExplorer(explorerView, transaction.recipient);
  const openBaker = useCallback(() => {
    if (bakerURL) openURL(bakerURL);
  }, [bakerURL]);
  return (
    <TransactionConfirmField label={field.label}>
      <Text onClick={openBaker} color="primary.c80" ml={1} ff="Inter|Medium" fontSize={3}>
        {baker ? baker.name : shortAddressPreview(transaction.recipient)}
      </Text>
    </TransactionConfirmField>
  );
};

const fieldComponents = {
  delegateValidator: DelegateValidator,
};
export default {
  fieldComponents,
};
