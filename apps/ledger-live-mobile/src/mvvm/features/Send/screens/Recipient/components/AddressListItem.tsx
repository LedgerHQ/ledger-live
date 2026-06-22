import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  Spot,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
import React from "react";
import { useTranslation } from "~/context/Locale";

type AddressListItemProps = Readonly<{
  address: string;
  name?: string;
  description?: string;
  onSelect?: () => void;
  showSendTo?: boolean;
  disabled?: boolean;
  hideDescription?: boolean;
}>;

export function AddressListItem({
  address,
  name,
  description,
  onSelect,
  showSendTo = false,
  disabled = false,
  hideDescription = false,
}: AddressListItemProps) {
  const { t } = useTranslation();
  const displayName = name ?? formatAddress(address, { prefixLength: 5, suffixLength: 5 });

  const fallbackDescription = formatAddress(address, { prefixLength: 5, suffixLength: 5 });
  const subtitle = disabled || hideDescription ? undefined : (description ?? fallbackDescription);

  const title = showSendTo ? t("send.newSendFlow.sendTo", { address: displayName }) : displayName;

  return (
    <ListItem onPress={disabled ? undefined : onSelect} disabled={disabled}>
      <ListItemLeading>
        <Spot appearance="icon" icon={Wallet} lx={{ marginRight: "s4" }} />
        <ListItemContent>
          <ListItemTitle typography="body2SemiBold">{title}</ListItemTitle>
          <ListItemDescription typography="body3" ellipsizeMode="middle">
            {subtitle}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ChevronRight size={24} />
      </ListItemTrailing>
    </ListItem>
  );
}
