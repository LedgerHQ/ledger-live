import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemSpot,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, LedgerLogo, Wallet } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";
import React from "react";
import { useTranslation } from "react-i18next";
import { useFormatRelativeDate } from "../hooks/useFormatRelativeDate";

type AddressListItemProps = Readonly<{
  address: string;
  name?: string;
  description?: string;
  date?: Date;
  balance?: string;
  balanceFormatted?: string;
  onSelect?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  showSendTo?: boolean;
  isLedgerAccount?: boolean;
  disabled?: boolean;
  hideDescription?: boolean;
  testId?: string;
}>;

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
  testId,
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
      data-testid={testId}
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
