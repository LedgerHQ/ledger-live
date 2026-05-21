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
import { MoreHorizontal } from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactEntry } from "~/renderer/contacts/types";
import { getChainInfo } from "../utils/getChainInfo";
import { truncateAddressLong } from "../utils/truncateAddressLong";

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
 * - Trailing: bare Lumen `MoreHorizontal` symbol — the Figma renders a
 *   plain 24px icon with no button chrome (no Spot, no tinted background).
 *   When L4.1 wires the per-row overflow menu, swap to an
 *   `IconButton appearance="no-background"` to retain hover/focus states
 *   and an accessible label.
 *
 * TODO(contacts-L4.1): wire a Lumen `DropdownMenu` against this trailing
 * affordance for edit / copy / remove on the address.
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
        <MoreHorizontal
          size={24}
          className="text-muted"
          data-testid="contacts-management-address-actions"
        />
      </ListItemTrailing>
    </ListItem>
  );
}
