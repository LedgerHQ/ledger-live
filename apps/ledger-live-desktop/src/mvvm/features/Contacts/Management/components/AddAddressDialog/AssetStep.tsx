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
      className="flex flex-col gap-16 px-24 pb-24"
      data-testid="contacts-management-add-address-asset-step"
    >
      <SearchInput
        appearance="plain"
        placeholder={t("contactsManagement.addAddress.searchAsset")}
        value={query}
        onChange={e => setQuery(e.target.value)}
        data-testid="contacts-management-add-address-asset-search"
      />
      <div className="flex flex-col gap-4 max-h-360 overflow-y-auto">
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
                <CryptoIcon
                  ticker={c.ticker}
                  ledgerId={c.id}
                  size={40}
                  alt={c.name}
                />
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
