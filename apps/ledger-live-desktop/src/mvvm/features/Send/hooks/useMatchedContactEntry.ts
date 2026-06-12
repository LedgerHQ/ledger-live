import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { contactsAlphaSelector } from "~/renderer/reducers/settings";
import { useContactsStore } from "~/renderer/contacts/hooks";
import { getCryptoMeta, useCryptoMeta } from "~/mvvm/features/Contacts/Management/utils/cryptoMeta";
import {
  getCryptoById,
  getNativeCryptoIdForChain,
} from "~/mvvm/features/Contacts/Management/utils/getCryptoById";

export type MatchedContactEntry = Readonly<{
  /** The contact's display name. */
  name: string;
  /** The matched entry's per-address name (e.g. "Ethereum"); may be empty. */
  scope?: string;
}>;

const normalize = (addressHex: string): string => {
  const trimmed = addressHex.trim().toLowerCase();
  return trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
};

/**
 * Resolve a fully-typed recipient address to an address-book contact entry
 * on the given chain (Figma 14437:40510 — the contact-matched row).
 *
 * Unlike `resolveContact` this only looks at EXTERNAL contacts: matches
 * against the user's own Ledger accounts are handled separately by the
 * matched-accounts path in `useAddressValidation`.
 *
 * When `selectedTicker` is set, the entry's resolved crypto (cryptoMeta
 * sidecar annotation, chain-native fallback — same resolution as the
 * suggestion lists) must also match: an address saved as QNT does not
 * surface as a contact match while sending ETH.
 */
export const useMatchedContactEntry = (
  address: string | undefined,
  chainId: number | undefined,
  selectedTicker?: string,
): MatchedContactEntry | null => {
  const contactsAlpha = useSelector(contactsAlphaSelector);
  const { wallet, hydrated } = useContactsStore();
  const cryptoMeta = useCryptoMeta();

  return useMemo(() => {
    if (!contactsAlpha || !hydrated || !address || chainId === undefined) return null;
    const target = normalize(address);
    if (target.length === 0) return null;
    for (const contact of Object.values(wallet.contacts)) {
      for (const entry of contact.entries) {
        if (entry.chainId !== chainId || normalize(entry.addressHex) !== target) continue;
        if (selectedTicker) {
          const cryptoId =
            getCryptoMeta(cryptoMeta, entry.addressHex, entry.chainId, entry.scope) ??
            getNativeCryptoIdForChain(entry.chainId);
          const crypto = cryptoId === undefined ? undefined : getCryptoById(cryptoId);
          if (!crypto || crypto.ticker.toUpperCase() !== selectedTicker.toUpperCase()) continue;
        }
        return { name: contact.name, scope: entry.scope };
      }
    }
    return null;
  }, [contactsAlpha, hydrated, wallet, address, chainId, selectedTicker, cryptoMeta]);
};
