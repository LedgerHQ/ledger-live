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
import type { CryptoOption } from "~/mvvm/features/Contacts/constants/topCryptos";
import { getChainInfo } from "../utils/getChainInfo";
import { truncateAddressLong } from "../utils/truncateAddressLong";
import { AddressRowMenu } from "./AddressRowMenu";

type Props = {
  entry: ContactEntry;
  /**
   * The crypto resolved by the grouping layer (sidecar metadata, or
   * the chain's native gas token as a fallback). Passed in so the row
   * never has to re-resolve — the parent already did.
   */
  crypto: CryptoOption;
  onSelect: (entry: ContactEntry) => void;
};

/**
 * One address row in the contact details pane.
 *
 * Layout matches the Figma frame 13827:32002:
 * - Leading: the resolved crypto's icon (e.g. USDC) with a small
 *   network-chain badge (e.g. Ethereum) — `CryptoIcon`'s built-in
 *   `network` prop attaches the dot-symbol in the corner. Falls back
 *   to the chain's gas token when the crypto is the chain native
 *   (avoids the redundant ETH-on-ETH badge).
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
export function AddressRow({ entry, crypto, onSelect }: Props) {
  const chain = getChainInfo(entry.chainId);

  // Don't render the chain badge when the crypto IS the chain native
  // gas token — looks redundant (ETH icon with ETH dot, USDC icon
  // with… still the chain it's on, so we always want the badge for
  // tokens but skip for natives).
  const isNativeOfChain = crypto.ticker.toLowerCase() === chain.ticker.toLowerCase();
  const networkBadge = isNativeOfChain ? undefined : chain.ledgerId;

  return (
    <ListItem
      density="expanded"
      onClick={() => onSelect(entry)}
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
          network={networkBadge}
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
          <AddressRowMenu />
        </div>
      </ListItemTrailing>
    </ListItem>
  );
}
