import React from "react";
import { useTranslation } from "react-i18next";
import {
  ListItem,
  ListItemTrailing,
  ListItemDescription,
  ListItemTitle,
  ListItemContent,
  ListItemLeading,
  ListItemSpot,
} from "@ledgerhq/lumen-ui-react";
import { Wallet, LedgerLogo, ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { useFormatRelativeDate } from "../hooks/useFormatRelativeDate";
import { cn } from "LLD/utils/cn";
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
  const formatRelativeDate = useFormatRelativeDate();
  const displayName = name ?? formatAddress(address, { prefixLength: 5, suffixLength: 5 });

  const fallbackDescription = date
    ? formatRelativeDate(date)
    : formatAddress(address, { prefixLength: 5, suffixLength: 5 });

  const subtitle = disabled || hideDescription ? undefined : description ?? fallbackDescription;
  const icon = isLedgerAccount ? LedgerLogo : Wallet;

  const trailingContent =
    balance && balanceFormatted ? (
      <div className="flex flex-col items-end">
        <span className="truncate body-2-semi-bold text-base">{balanceFormatted}</span>
        <span className="truncate body-3 text-muted">{balance}</span>
      </div>
    ) : undefined;

  const title = showSendTo ? t("newSendFlow.sendTo", { address: displayName }) : displayName;

  return (
    <ListItem
      onClick={disabled ? undefined : onSelect}
      onContextMenu={onContextMenu}
      className={cn("mb-6", {
        "cursor-not-allowed opacity-50": disabled,
      })}
    >
      <ListItemLeading>
        <ListItemSpot appearance="icon" icon={icon} />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription>{subtitle}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>{trailingContent || <ChevronRight size={24} />}</ListItemTrailing>
    </ListItem>
  );
}
