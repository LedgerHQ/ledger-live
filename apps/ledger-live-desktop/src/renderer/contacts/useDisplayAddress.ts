import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { contactsAlphaSelector } from "~/renderer/reducers/settings";
import { useContactsStore } from "./hooks";
import type { ContactsWallet } from "./types";
import type { ContactBadgeKind } from "./ContactBadge";

const normalize = (addressHex: string): string => {
  const trimmed = addressHex.trim().toLowerCase();
  return trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
};

export type ContactResolution = {
  name: string;
  kind: ContactBadgeKind;
};

/**
 * Pure resolution against the in-memory wallet snapshot. Prefers a registered
 * Ledger account over an external contact for the same address — same
 * precedence as the data source's `lookupTo`. Safe to call from a `.map` or
 * `useMemo` without hook-rule concerns.
 */
export const resolveContact = (
  wallet: ContactsWallet,
  address: string,
  chainId: number,
): ContactResolution | null => {
  const target = normalize(address);
  for (const account of Object.values(wallet.accounts)) {
    if (account.chainId === chainId && normalize(account.addressHex) === target) {
      return { name: account.name, kind: "ledgerAccount" };
    }
  }
  for (const contact of Object.values(wallet.contacts)) {
    for (const entry of contact.entries) {
      if (entry.chainId === chainId && normalize(entry.addressHex) === target) {
        return { name: contact.name, kind: "external" };
      }
    }
  }
  return null;
};

export const useContactResolution = (
  address: string | undefined,
  chainId: number | undefined,
): ContactResolution | null => {
  const contactsAlpha = useSelector(contactsAlphaSelector);
  const { wallet, hydrated } = useContactsStore();
  return useMemo(() => {
    if (!contactsAlpha || !hydrated || !address || chainId === undefined) return null;
    return resolveContact(wallet, address, chainId);
  }, [contactsAlpha, hydrated, wallet, address, chainId]);
};

export const useDisplayAddress = (
  address: string | undefined,
  chainId: number | undefined,
): string | undefined => {
  const resolution = useContactResolution(address, chainId);
  return resolution?.name ?? address;
};
