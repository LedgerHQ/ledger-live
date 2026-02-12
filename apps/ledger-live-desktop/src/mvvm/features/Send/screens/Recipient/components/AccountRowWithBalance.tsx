import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { AddressListItem } from "./AddressListItem";
import { useFormattedAccountBalance } from "../hooks/useFormattedAccountBalance";

type AccountRowWithBalanceProps = Readonly<{
  account: Account;
  onSelect: () => void;
  showSendTo?: boolean;
  disabled?: boolean;
  customName?: string;
}>;

export function AccountRowWithBalance({
  account,
  onSelect,
  showSendTo = false,
  disabled = false,
  customName,
}: AccountRowWithBalanceProps) {
  const accountName = useMaybeAccountName(account);
  const { formattedBalance, formattedCounterValue } = useFormattedAccountBalance(account);

  const displayName = customName ?? accountName ?? "Account";

  return (
    <AddressListItem
      address={account.freshAddress}
      name={displayName}
      description={formatAddress(account.freshAddress, { prefixLength: 5, suffixLength: 5 })}
      balance={formattedBalance}
      balanceFormatted={formattedCounterValue}
      onSelect={onSelect}
      showSendTo={showSendTo}
      isLedgerAccount
      disabled={disabled}
    />
  );
}
