import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import type { ContactEntry } from "~/renderer/contacts/types";
import { truncateAddress } from "~/mvvm/features/History/utils/truncateAddress";
import { getChainLabel } from "../utils/getChainLabel";

type Props = {
  entry: ContactEntry;
};

/**
 * One address row inside the details pane.
 *
 * Title = the user's address label (`entry.scope`, matching the L3.5
 * convention — what the user actually called the address, e.g. "main").
 * Description = the truncated 0x address. Trailing = a Lumen `Tag` with
 * the chain label so multi-chain contacts read at a glance.
 *
 * Row is not clickable in L4 — edit/copy actions land in a follow-up.
 */
export function AddressRow({ entry }: Props) {
  return (
    <ListItem className="bg-surface" data-testid="contacts-management-address-row">
      <ListItemLeading>
        <ListItemContent>
          <ListItemTitle>{entry.scope}</ListItemTitle>
          <ListItemDescription>{truncateAddress(entry.addressHex)}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <Tag size="sm" appearance="gray" label={getChainLabel(entry.chainId)} />
      </ListItemTrailing>
    </ListItem>
  );
}
