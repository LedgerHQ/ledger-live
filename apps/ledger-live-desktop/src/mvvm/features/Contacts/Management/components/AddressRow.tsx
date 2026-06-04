import React, { useRef } from "react";
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
import type { CryptoOption } from "~/mvvm/features/Contacts/constants/topCryptos";
import { getChainInfo } from "../utils/getChainInfo";
import { truncateAddressLong } from "../utils/truncateAddressLong";
import { AddressRowMenu, type AddressRowMenuHandle } from "./AddressRowMenu";

type Props = {
  entry: ContactEntry;
  /**
   * The crypto resolved by the grouping layer (sidecar metadata, or
   * the chain's native gas token as a fallback). Passed in so the row
   * never has to re-resolve — the parent already did.
   */
  crypto: CryptoOption;
  onSelect: (entry: ContactEntry) => void;
  /**
   * Fired when the user picks "Delete address" from the trailing
   * overflow menu. Optional so the row can be used in contexts that
   * don't expose the delete affordance yet.
   */
  onDeleteAddress?: (entry: ContactEntry) => void;
  /**
   * Fired when the user picks "Rename address" from the trailing
   * overflow menu. Optional so the row can be used in contexts that
   * don't expose the rename affordance yet.
   */
  onRenameAddress?: (entry: ContactEntry) => void;
  /**
   * Fired when the user picks "Edit address" from the trailing
   * overflow menu. Optional so the row can be used in contexts that
   * don't expose the edit affordance yet.
   */
  onEditAddress?: (entry: ContactEntry) => void;
};

/**
 * One address row in the contact details pane.
 *
 * Layout matches the Figma frame 13827:32002:
 * - Leading: the resolved crypto's icon (e.g. USDC) with a small
 *   network-chain badge (e.g. Ethereum) — `CryptoIcon`'s built-in
 *   `network` prop attaches the dot-symbol in the corner. The badge
 *   is rendered unconditionally, including for chain-native rows
 *   (ETH on Ethereum), because the network is part of the address's
 *   identity and the designer wants it visually consistent across
 *   every row.
 * - Title row: `entry.scope` (the user's label) + a Lumen `Tag` with
 *   the network label, side-by-side via `ListItemContentRow`.
 * - Description: truncated 0x address (wider envelope than the inline
 *   `truncateAddress` util — see `truncateAddressLong`).
 * - Trailing: `AddressRowMenu` — a Lumen `Popover` anchored on an
 *   `IconButton` with four overflow actions. Inert in L4.
 *
 * Clicking anywhere on the row (outside the trailing menu) opens the
 * address-detail dialog with the full address + QR code.
 */
export function AddressRow({
  entry,
  crypto,
  onSelect,
  onDeleteAddress,
  onRenameAddress,
  onEditAddress,
}: Props) {
  const chain = getChainInfo(entry.chainId);

  // The trailing menu exposes an `openAt(x, y)` imperative method —
  // we drive it from up here on `contextmenu` so a right-click
  // anywhere on the row body pops the menu at the cursor. The `…`
  // IconButton inside the menu still self-opens (anchored to itself);
  // both gestures end up at the same Popover, just anchored to
  // different points.
  const menuRef = useRef<AddressRowMenuHandle | null>(null);

  return (
    <ListItem
      density="expanded"
      onClick={() => onSelect(entry)}
      onContextMenu={e => {
        // Suppress the native browser context menu and open ours at
        // the cursor coordinates instead. `preventDefault` also
        // ensures the contextmenu event doesn't bleed into any
        // accidental click selection.
        e.preventDefault();
        menuRef.current?.openAt(e.clientX, e.clientY);
      }}
      data-testid="contacts-management-address-row"
    >
      <ListItemLeading>
        <CryptoIcon
          ticker={crypto.ticker}
          // `crypto.ledgerId` is the canonical Ledger Live id resolved
          // against both icon registries (primary `crypto-icons.ledger.
          // com/index.json` and the CoinGecko fallback). For natives
          // it's a simple slug (`bitcoin`, `ethereum`, `bsc`); for
          // tokens it's the CAL format (`ethereum/erc20/usd__coin`).
          // See `constants/topCryptos.ts` for the resolution notes.
          ledgerId={crypto.ledgerId}
          // Always render the network badge — including the visually
          // redundant ETH-on-Ethereum case — so the icon shape stays
          // consistent across the row stack and the network is always
          // legible at a glance.
          network={chain.ledgerId}
          size={48}
          alt={crypto.name}
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
        {/*
          Wrap the trailing menu in a click-stopper so the popover trigger
          / menu items don't bubble up to the parent ListItem's onClick
          (which would also open the address-detail dialog).
        */}
        <div onClick={e => e.stopPropagation()}>
          {/*
            "See QR Code" routes through the same `onSelect` we use when
            the row body itself is clicked — both surfaces open the
            address-detail dialog with the QR + actions. Keeping a single
            entry-point means the dialog's open/crypto state machinery
            stays in one place (ContactDetails).
          */}
          <AddressRowMenu
            ref={menuRef}
            onShowQrCode={() => onSelect(entry)}
            onDeleteAddress={onDeleteAddress ? () => onDeleteAddress(entry) : undefined}
            onRenameAddress={onRenameAddress ? () => onRenameAddress(entry) : undefined}
            onEditAddress={onEditAddress ? () => onEditAddress(entry) : undefined}
          />
        </div>
      </ListItemTrailing>
    </ListItem>
  );
}
