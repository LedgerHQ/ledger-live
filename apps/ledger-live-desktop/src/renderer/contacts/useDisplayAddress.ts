import { useSelector } from "LLD/hooks/redux";
import { contactsAlphaSelector } from "~/renderer/reducers/settings";
import { useContactsStore } from "./hooks";
import type { ContactsWallet } from "./types";

const normalize = (addressHex: string): string => addressHex.trim().toLowerCase();

const findDisplayName = (wallet: ContactsWallet, address: string, chainId: number): string | null => {
  const target = normalize(address);
  for (const account of Object.values(wallet.accounts)) {
    if (account.chainId === chainId && normalize(account.addressHex) === target) {
      return account.name;
    }
  }
  for (const contact of Object.values(wallet.contacts)) {
    for (const entry of contact.entries) {
      if (entry.chainId === chainId && normalize(entry.addressHex) === target) {
        return contact.name;
      }
    }
  }
  return null;
};

export const useDisplayAddress = (
  address: string | undefined,
  chainId: number | undefined,
): string | undefined => {
  const contactsAlpha = useSelector(contactsAlphaSelector);
  const { wallet, hydrated } = useContactsStore();
  if (!contactsAlpha || !hydrated || !address || chainId === undefined) return address;
  return findDisplayName(wallet, address, chainId) ?? address;
};
