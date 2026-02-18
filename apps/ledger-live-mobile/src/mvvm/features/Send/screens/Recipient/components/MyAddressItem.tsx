import React from "react";
import { AddressListItem } from "./AddressListItem";
import { useFormattedAccountBalance } from "../hooks/useFormattedAccountBalance";
import { Account } from "@ledgerhq/types-live";
import { useMaybeAccountName } from "~/reducers/wallet";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";

export const MyAddressItem = ({
  currentAccount,
  onSelect,
}: {
  currentAccount: Account;
  onSelect: (account: Account) => void;
}) => {
  const { formattedBalance, formattedCounterValue } = useFormattedAccountBalance(currentAccount);

  const name = useMaybeAccountName(currentAccount);

  const description = formatAddress(currentAccount.freshAddress, {
    prefixLength: 5,
    suffixLength: 5,
  });

  return (
    <AddressListItem
      address={currentAccount.freshAddress}
      name={name}
      description={description}
      date={undefined}
      balance={formattedBalance}
      balanceFormatted={formattedCounterValue}
      isLedgerAccount={true}
      onSelect={() => onSelect(currentAccount)}
    />
  );
};
