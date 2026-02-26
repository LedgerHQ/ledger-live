import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemSpot,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, LedgerLogo, Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
import React from "react";
import { useTranslation } from "~/context/Locale";
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
  rightIcon?: React.ReactNode;
}>;

export function AddressListItem({
  address,
  name,
  description,
  date,
  balance,
  balanceFormatted,
  onSelect,
  showSendTo = false,
  isLedgerAccount = false,
  disabled = false,
  hideDescription = false,
  rightIcon = <ChevronRight size={24} />,
}: AddressListItemProps) {
  const { t } = useTranslation();
  const displayName = name ?? formatAddress(address, { prefixLength: 5, suffixLength: 5 });
  const formatRelativeDate = useFormatRelativeDate();

  const fallbackDescription = date
    ? formatRelativeDate(date)
    : formatAddress(address, { prefixLength: 5, suffixLength: 5 });

  const subtitle = disabled || hideDescription ? undefined : description ?? fallbackDescription;
  const icon = isLedgerAccount ? LedgerLogo : Wallet;

  const trailingContent =
    balance && balanceFormatted ? (
      <ListItemContent>
        <ListItemTitle>{balanceFormatted}</ListItemTitle>
        <ListItemDescription>{balance}</ListItemDescription>
      </ListItemContent>
    ) : undefined;

  const title = showSendTo ? t("send.newSendFlow.sendTo", { address: displayName }) : displayName;

  return (
    <ListItem onPress={disabled ? undefined : onSelect} disabled={disabled}>
      <ListItemLeading>
        <ListItemSpot appearance="icon" icon={icon} lx={{ marginRight: "s4" }} />
        <ListItemContent>
          <ListItemTitle typography="body2SemiBold">{title}</ListItemTitle>
          <ListItemDescription typography="body3" ellipsizeMode="middle">
            {subtitle}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>{trailingContent || rightIcon}</ListItemTrailing>
    </ListItem>
  );
}
