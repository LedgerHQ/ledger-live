import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  IconButton,
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
import { useTranslation } from "react-i18next";
import type { ContactEntry } from "~/renderer/contacts/types";
import { getChainInfo } from "../utils/getChainInfo";
import { truncateAddressLong } from "../utils/truncateAddressLong";

type Props = {
  entry: ContactEntry;
};

/**
 * One address row in the contact details pane.
 *
 * Layout matches the Figma frame 13802:2833:
 * - Leading: `CryptoIcon` for the chain's native gas token (we don't have
 *   per-address token info today; the chain icon is the closest signal).
 * - Title row: `entry.scope` (the user's label) + a Lumen `Tag` with the
 *   network label, side-by-side via `ListItemContentRow`.
 * - Description: truncated 0x address (wider envelope than the inline
 *   `truncateAddress` util — see `truncateAddressLong`).
 * - Trailing: per-row `MoreHorizontal` icon button. Intentionally NOT
 *   wired in L4 (no `onClick`) so Lumen's hover/press states still render —
 *   the per-row edit/copy/delete actions land in L4.1.
 *
 * TODO(contacts-L4.1): wire the trailing IconButton to a Lumen
 * `DropdownMenu` for edit / copy / remove on the address.
 */
export function AddressRow({ entry }: Props) {
  const { t } = useTranslation();
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
        <IconButton
          appearance="transparent"
          size="sm"
          icon={MoreHorizontal}
          aria-label={t("contactsManagement.addressActions")}
          data-testid="contacts-management-address-actions"
        />
      </ListItemTrailing>
    </ListItem>
  );
}
