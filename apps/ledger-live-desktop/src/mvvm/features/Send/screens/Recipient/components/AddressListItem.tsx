import React from "react";
import { useTranslation } from "react-i18next";
import { ListItem, Spot } from "@ledgerhq/lumen-ui-react";
import { Wallet, LedgerLogo, ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import { formatAddress } from "@ledgerhq/react-ui/pre-ldls/components/Address/formatAddress";
import { formatRelativeDate } from "../utils/dateFormatter";
import type { AddressListItemProps } from "../types";

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
  hideDescription = false,
}: AddressListItemProps) {
  const { t } = useTranslation();
  const displayName = name ?? formatAddress(address, { prefixLength: 5, suffixLength: 5 });

  const fallbackDescription = date
    ? formatRelativeDate(date)
    : formatAddress(address, { prefixLength: 5, suffixLength: 5 });

  const subtitle = disabled || hideDescription ? undefined : description ?? fallbackDescription;
  const icon = isLedgerAccount ? LedgerLogo : Wallet;

  const trailingContent =
    balance && balanceFormatted ? (
      <div className="flex flex-col items-end">
        <span className="truncate text-base body-2-semi-bold">{balanceFormatted}</span>
        <span className="truncate text-muted body-3">{balance}</span>
      </div>
    ) : undefined;

  const className = disabled ? "mb-6 cursor-not-allowed opacity-50" : "mb-6";

  const title = showSendTo ? t("newSendFlow.sendTo", { address: displayName }) : displayName;

  return (
    <ListItem
      title={title}
      description={subtitle}
      leadingContent={<Spot appearance="icon" icon={icon} />}
      trailingContent={trailingContent || <ChevronRight size={24} />}
      onClick={disabled ? undefined : onSelect}
      onContextMenu={onContextMenu}
      className={className}
    />
  );
}
