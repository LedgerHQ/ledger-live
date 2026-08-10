import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { SEND_ADDRESS_FORMAT_OPTIONS } from "@ledgerhq/live-common/flows/send/utils";
import { useTranslation } from "~/context/Locale";
import { AddressListItem } from "./AddressListItem";
import { useFormattedAccountBalance } from "LLM/hooks/useFormattedAccountBalance";
import { useMaybeAccountName } from "~/reducers/wallet";

type AccountRowWithBalanceProps = Readonly<{
  account: Account;
  onSelect: () => void;
  showSendTo?: boolean;
  disabled?: boolean;
  customName?: string;
  testID?: string;
}>;

export function AccountRowWithBalance({
  account,
  onSelect,
  showSendTo = false,
  disabled = false,
  customName,
  testID,
}: AccountRowWithBalanceProps) {
  const { t } = useTranslation();
  const accountName = useMaybeAccountName(account);
  const { formattedBalance, formattedCounterValue } = useFormattedAccountBalance(account);

  const displayName = customName ?? accountName ?? t("send.newSendFlow.account");

  return (
    <AddressListItem
      address={account.freshAddress}
      name={displayName}
      description={formatAddress(account.freshAddress, SEND_ADDRESS_FORMAT_OPTIONS)}
      balance={formattedBalance}
      balanceFormatted={formattedCounterValue}
      onSelect={onSelect}
      showSendTo={showSendTo}
      isLedgerAccount
      disabled={disabled}
      testID={testID}
    />
  );
}
