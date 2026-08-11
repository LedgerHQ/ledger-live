import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { MoreHorizontal } from "@ledgerhq/lumen-ui-react/symbols";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactDetailAddressRow } from "../../types";
import { resolveContactAddressIconProps } from "../../model/resolveContactAddressIcon";
import { truncateContactAddress } from "../../utils/truncateContactAddress";

type ContactDetailAddressRowProps = Readonly<{
  row: ContactDetailAddressRow;
  networkId: CryptoCurrency["id"];
  onPress: (intent: ContactDetailAddressRow["intent"]) => void;
}>;

export function ContactDetailAddressRow({
  row,
  networkId,
  onPress,
}: ContactDetailAddressRowProps): React.ReactNode {
  const iconProps = resolveContactAddressIconProps(row.currencyId, row.label, networkId);

  return (
    <ListItem
      onClick={() => onPress(row.intent)}
      className="bg-surface"
      data-testid={`contacts-detail-address-row-${row.addressId}`}
    >
      <ListItemLeading>
        <CryptoIcon
          ledgerId={iconProps.ledgerId}
          ticker={iconProps.ticker}
          network={iconProps.network}
          size={48}
          shape="circle"
        />
        <ListItemContent>
          <ListItemTitle>{row.label}</ListItemTitle>
          <ListItemDescription>{truncateContactAddress(row.address)}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <MoreHorizontal size={20} className="text-muted" aria-hidden />
      </ListItemTrailing>
    </ListItem>
  );
}
