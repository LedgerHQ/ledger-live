import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  ListItem,
  ListItemContent,
  ListItemContentRow,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import type { ContactEntry } from "~/renderer/contacts/types";
import { getChainInfo } from "../utils/getChainInfo";
import { truncateAddressLong } from "../utils/truncateAddressLong";
import { AddressRowMenu } from "./AddressRowMenu";

type Props = {
  entry: ContactEntry;
};

/**
 * One address row in the contact details pane.
 *
 * Layout matches the Figma frame 13827:32002:
 * - Leading: `CryptoIcon` for the chain's native gas token (we don't have
 *   per-address token info today; the chain icon is the closest signal).
 * - Title row: `entry.scope` (the user's label) + a Lumen `Tag` with the
 *   network label, side-by-side via `ListItemContentRow`.
 * - Description: truncated 0x address (wider envelope than the inline
 *   `truncateAddress` util — see `truncateAddressLong`).
 * - Trailing: `AddressRowMenu` — a Lumen `Popover` anchored on an
 *   `IconButton` (`appearance="no-background"`, MoreHorizontal symbol)
 *   with four overflow actions. The trigger and menu items both carry
 *   hover/pressed/focus states from Lumen; the items themselves are
 *   intentionally inert in L4 (wiring lands in L4.1).
 */
export function AddressRow({ entry }: Props) {
  const chain = getChainInfo(entry.chainId);

  return (
    <ListItem
      density="expanded"
      data-testid="contacts-management-address-row"
    >
      <ListItemLeading>
        <CryptoIcon
          ticker={chain.ticker}
          ledgerId={chain.ledgerId}
          size={48}
          alt={chain.shortLabel}
        />
        <ListItemContent>
          <ListItemContentRow>
            <ListItemTitle>{entry.scope}</ListItemTitle>
            <Tag size="sm" appearance="gray" label={chain.label} />
          </ListItemContentRow>
          <ListItemDescription>
            {truncateAddressLong(entry.addressHex)}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <AddressRowMenu />
      </ListItemTrailing>
    </ListItem>
  );
}
