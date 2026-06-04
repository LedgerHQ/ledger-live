import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  SearchInput,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  TOP_CRYPTOS,
  type CryptoOption,
} from "~/mvvm/features/Contacts/constants/topCryptos";
import { isCryptoEvmCompatible } from "~/mvvm/features/Contacts/utils/getNetworksForCrypto";

type Props = {
  onPick: (crypto: CryptoOption) => void;
};

/**
 * Step 1 of the Add-Address flow (Figma frame 13936:12930).
 *
 * Search-filtered list of the top 50 cryptos. Non-EVM cryptos are
 * disabled at the row level via Lumen's `ListItem.disabled` prop —
 * the underlying DMK Contacts verbs are EVM-only today, so a
 * Bitcoin/Solana/XRP/Cardano address can't actually be registered.
 * `isCryptoEvmCompatible` (`utils/getNetworksForCrypto.ts`) is the
 * single source of truth for that gate.
 *
 * Search matches both `name` and `ticker` (case-insensitive
 * substring), so "USD" surfaces both USDT and USDC.
 */
export function AssetStep({ onPick }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = useMemo<CryptoOption[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOP_CRYPTOS;
    return TOP_CRYPTOS.filter(
      c => c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div
      // No horizontal padding here — the parent DialogBody now overrides
      // Lumen's intrinsic `px-24` to `px-16` to match the Figma content-slot.
      // From there:
      //   row left edge       = 16px (modal → DialogBody px-16)
      //   row icon             = 24px (+ Lumen ListItem's intrinsic px-8)
      //   search input text   = 24px (+ the `px-8` wrapper below)
      // All aligned with the title (DialogHeader's px-24).
      // `gap-24` between search and list matches .asset-selector-content.
      // Vertical padding (`pt-8 pb-24`) is owned by the parent
      // `DialogBody` — see the comment block on `AddAddressDialog`'s
      // body className. Adding it here too would stack on top of
      // Lumen's intrinsic body padding (~48px below the list / button).
      className="flex flex-col gap-24"
      data-testid="contacts-management-add-address-asset-step"
    >
      <div className="px-8">
        <SearchInput
          appearance="plain"
          placeholder={t("contactsManagement.addAddress.searchAsset")}
          value={query}
          onChange={e => setQuery(e.target.value)}
          data-testid="contacts-management-add-address-asset-search"
        />
      </div>
      <div className="flex flex-col gap-0 max-h-360 overflow-y-auto w-full">
        {filtered.map(c => {
          const enabled = isCryptoEvmCompatible(c.id);
          return (
            <ListItem
              key={c.id}
              density="expanded"
              disabled={!enabled}
              onClick={enabled ? () => onPick(c) : undefined}
              data-testid={`contacts-management-add-address-asset-${c.id}`}
              data-disabled={enabled ? "false" : "true"}
            >
              <ListItemLeading>
                {/*
                  Disabled rows (non-EVM cryptos in L4) get a grayscale
                  + 60% opacity filter on the icon so the row reads as
                  fully muted at a glance — matches the dimmed title /
                  ticker text Lumen already gives us via `disabled`.
                  `CryptoIcon` doesn't accept a `className` for its
                  internal SVG, so we apply the filter via a wrapper
                  div — CSS filters cascade into children.
                */}
                <div className={enabled ? undefined : "grayscale opacity-60"}>
                  <CryptoIcon
                    ticker={c.ticker}
                    // `c.ledgerId` is the Ledger Live canonical id resolved
                    // against `crypto-icons.ledger.com/index.json` — using
                    // the CoinGecko slug (`c.id`) misses the registry for
                    // tokens like USDC / USDT / MANA / etc. and falls back
                    // to the letter avatar. Same fix as `AddressRow.tsx`.
                    ledgerId={c.ledgerId}
                    size={40}
                    alt={c.name}
                  />
                </div>
                <ListItemContent>
                  <ListItemTitle>{c.name}</ListItemTitle>
                  <ListItemDescription>{c.ticker}</ListItemDescription>
                </ListItemContent>
              </ListItemLeading>
            </ListItem>
          );
        })}
      </div>
    </div>
  );
}
