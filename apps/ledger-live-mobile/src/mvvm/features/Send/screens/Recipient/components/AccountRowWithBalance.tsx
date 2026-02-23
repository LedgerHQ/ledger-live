import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { useTranslation } from "~/context/Locale";
import { AddressListItem } from "./AddressListItem";
import { useFormattedAccountBalance } from "../hooks/useFormattedAccountBalance";
import { useMaybeAccountName } from "~/reducers/wallet";

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
  const { t } = useTranslation();
  const accountName = useMaybeAccountName(account);
  const { formattedBalance, formattedCounterValue } = useFormattedAccountBalance(account);

  const displayName = customName ?? accountName ?? t("send.newSendFlow.account");

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
