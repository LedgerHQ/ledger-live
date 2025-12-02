import React from "react";
import { ListItem, Spot } from "@ledgerhq/ldls-ui-react";
import { Wallet, LedgerLogo } from "@ledgerhq/ldls-ui-react/symbols";
import { formatAddress } from "@ledgerhq/react-ui/pre-ldls/components/Address/formatAddress";
import { formatRelativeDate } from "../utils/dateFormatter";
import type { AddressListItemProps } from "../../../types";

export function AddressListItem({
  address,
  name,
  description,
  date,
  balance,
  balanceFormatted,
  onSelect,
  onContextMenu,
  showSendTo = false,
  isLedgerAccount = false,
  disabled = false,
}: AddressListItemProps) {
  const displayName = name ?? formatAddress(address, { prefixLength: 5, suffixLength: 5 });
  const subtitle = disabled
    ? undefined
    : description ??
      (date
        ? formatRelativeDate(date)
        : formatAddress(address, { prefixLength: 5, suffixLength: 5 }));
  const icon = isLedgerAccount ? LedgerLogo : Wallet;

  const trailingContent =
    balance && balanceFormatted ? (
      <div className="flex flex-col items-end">
        <span className="body-2-semi-bold text-base truncate">{balanceFormatted}</span>
        <span className="body-3 text-muted truncate">{balance}</span>
      </div>
    ) : undefined;

  return (
    <ListItem
      title={showSendTo ? `Send to ${displayName}` : displayName}
      description={subtitle}
      leadingContent={<Spot appearance="icon" icon={icon} />}
      trailingContent={trailingContent}
      onClick={disabled ? undefined : onSelect}
      onContextMenu={onContextMenu}
      className={disabled ? "opacity-50 cursor-not-allowed" : undefined}
    />
  );
}
