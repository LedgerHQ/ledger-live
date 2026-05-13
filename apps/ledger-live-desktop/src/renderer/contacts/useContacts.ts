import { useCallback, useMemo } from "react";
import { lastValueFrom } from "rxjs";
import {
  ContactsServiceBuilder,
  DeviceActionStatus,
  type ContactsService,
  type EditExternalAddressLabelArgs,
  type RenameContactArgs,
} from "@ledgerhq/device-management-kit";
import {
  SignerEthBuilder,
  type EditExternalAddressArgs,
  type RegisterExternalAddressArgs,
  type RegisterLedgerAccountArgs,
  type SignerEth,
} from "@ledgerhq/device-signer-kit-ethereum";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-desktop";
import { useContactsStore } from "./hooks";
import type { Contact, ContactEntry, ContactsWallet, LedgerAccount } from "./types";

/**
 * Stable boundary contract for L3 (management UX) and L4 (Send-flow picker).
 * Designer's coding agent imports only this hook — never from
 * `@ledgerhq/device-management-kit`, `@ledgerhq/device-signer-kit-ethereum`,
 * or the underlying `useContactsStore()` / `./storage` / `./types`.
 *
 * Every DMK call routes through here so we have one instrumentation point
 * and one place to swap the snapshot for upstream-main once the DMK branch
 * is promoted.
 *
 * `sessionId` is owned by the caller — the L1 validation panel exposes a
 * Connect button that stashes it in component state; future surfaces can
 * source it from wherever LWD eventually models active sessions.
 */
export type UseContacts = {
  hydrated: boolean;
  wallet: ContactsWallet;
  isReady: boolean;

  addContact: (args: AddContactArgs) => Promise<Contact>;
  addAddressToContact: (args: AddAddressToContactArgs) => Promise<Contact>;
  editAddressLabel: (args: EditAddressLabelInput) => Promise<void>;
  editAddress: (args: EditAddressInput) => Promise<void>;
  renameContact: (args: RenameContactInput) => Promise<Contact>;
  addLedgerAccount: (args: AddLedgerAccountArgs) => Promise<LedgerAccount>;
  reset: () => Promise<void>;
};

export type AddContactArgs = Omit<RegisterExternalAddressArgs, "extension">;
export type AddAddressToContactArgs = Omit<RegisterExternalAddressArgs, "extension"> & {
  contactName: string;
};
export type EditAddressLabelInput = Omit<
  EditExternalAddressLabelArgs,
  "groupHandleHex" | "hmacProofHex" | "hmacRestHex" | "derivationPath"
>;
export type EditAddressInput = Omit<
  EditExternalAddressArgs,
  "groupHandleHex" | "hmacProofHex" | "hmacRestHex" | "derivationPath" | "scope"
>;
export type RenameContactInput = Pick<RenameContactArgs, "oldName" | "newName">;
export type AddLedgerAccountArgs = RegisterLedgerAccountArgs;

const awaitDeviceAction = async <Output, Err, Intermediate>(returnType: {
  observable: import("rxjs").Observable<
    import("@ledgerhq/device-management-kit").DeviceActionState<Output, Err, Intermediate>
  >;
}): Promise<Output> => {
  const final = await lastValueFrom(returnType.observable);
  if (final.status === DeviceActionStatus.Completed) return final.output;
  if (final.status === DeviceActionStatus.Error) {
    const err = final.error as unknown;
    if (err instanceof Error) throw err;
    throw new Error(typeof err === "string" ? err : JSON.stringify(err));
  }
  throw new Error(`Device action ended with status: ${final.status}`);
};

const lookupContact = (wallet: ContactsWallet, name: string): Contact => {
  const contact = wallet.contacts[name];
  if (!contact) throw new Error(`Contact "${name}" not found in local store`);
  return contact;
};

const lookupEntry = (contact: Contact, addressHex: string): ContactEntry => {
  const entry = contact.entries.find(e => e.addressHex === addressHex);
  if (!entry) throw new Error(`Address ${addressHex} not found on contact "${contact.name}"`);
  return entry;
};

export const useContacts = (sessionId: string | null): UseContacts => {
  const dmk = useDeviceManagementKit();
  const { hydrated, wallet, commit, reset: resetStore } = useContactsStore();

  const signerEth = useMemo<SignerEth | null>(
    () =>
      dmk && sessionId
        ? new SignerEthBuilder({
            dmk,
            sessionId,
            originToken: "ledger-wallet-desktop",
          }).build()
        : null,
    [dmk, sessionId],
  );

  const contactsService = useMemo<ContactsService | null>(
    () => (dmk && sessionId ? new ContactsServiceBuilder({ dmk, sessionId }).build() : null),
    [dmk, sessionId],
  );

  const requireSigner = useCallback((): SignerEth => {
    if (!signerEth) throw new Error("Device not connected");
    return signerEth;
  }, [signerEth]);

  const requireService = useCallback((): ContactsService => {
    if (!contactsService) throw new Error("Device not connected");
    return contactsService;
  }, [contactsService]);

  const addContact = useCallback(
    async (args: AddContactArgs): Promise<Contact> => {
      const result = await awaitDeviceAction(requireSigner().registerExternalAddress(args));
      const next: Contact = {
        name: args.name,
        groupHandleHex: result.groupHandleHex,
        hmacNameHex: result.hmacNameHex,
        entries: [
          {
            scope: args.scope,
            addressHex: args.addressHex,
            hmacRestHex: result.hmacRestHex,
            derivationPath: args.derivationPath,
            chainId: args.chainId,
          },
        ],
      };
      await commit({
        contacts: { ...wallet.contacts, [next.name]: next },
        accounts: wallet.accounts,
      });
      return next;
    },
    [requireSigner, commit, wallet],
  );

  const addAddressToContact = useCallback(
    async (args: AddAddressToContactArgs): Promise<Contact> => {
      const existing = lookupContact(wallet, args.contactName);
      const result = await awaitDeviceAction(
        requireSigner().registerExternalAddress({
          name: args.name,
          addressHex: args.addressHex,
          scope: args.scope,
          derivationPath: args.derivationPath,
          chainId: args.chainId,
          extension: {
            groupHandleHex: existing.groupHandleHex,
            hmacProofHex: existing.hmacNameHex,
          },
        }),
      );
      const next: Contact = {
        ...existing,
        hmacNameHex: result.hmacNameHex,
        entries: [
          ...existing.entries,
          {
            scope: args.scope,
            addressHex: args.addressHex,
            hmacRestHex: result.hmacRestHex,
            derivationPath: args.derivationPath,
            chainId: args.chainId,
          },
        ],
      };
      await commit({
        contacts: { ...wallet.contacts, [existing.name]: next },
        accounts: wallet.accounts,
      });
      return next;
    },
    [requireSigner, commit, wallet],
  );

  const editAddress = useCallback(
    async (args: EditAddressInput): Promise<void> => {
      const contact = lookupContact(wallet, args.contactName);
      const entry = lookupEntry(contact, args.oldAddressHex);
      const result = await awaitDeviceAction(
        requireSigner().editExternalAddress({
          contactName: args.contactName,
          oldAddressHex: args.oldAddressHex,
          newAddressHex: args.newAddressHex,
          scope: entry.scope,
          groupHandleHex: contact.groupHandleHex,
          hmacProofHex: contact.hmacNameHex,
          hmacRestHex: entry.hmacRestHex,
          derivationPath: entry.derivationPath,
          chainId: args.chainId,
        }),
      );
      const next: Contact = {
        ...contact,
        entries: contact.entries.map(e =>
          e === entry
            ? { ...e, addressHex: args.newAddressHex, hmacRestHex: result.hmacRestHex }
            : e,
        ),
      };
      await commit({
        contacts: { ...wallet.contacts, [contact.name]: next },
        accounts: wallet.accounts,
      });
    },
    [requireSigner, commit, wallet],
  );

  const editAddressLabel = useCallback(
    async (args: EditAddressLabelInput): Promise<void> => {
      const contact = lookupContact(wallet, args.contactName);
      const entry = lookupEntry(contact, args.addressHex);
      const result = await awaitDeviceAction(
        requireService().editExternalAddressLabel({
          contactName: args.contactName,
          oldLabel: args.oldLabel,
          newLabel: args.newLabel,
          addressHex: args.addressHex,
          groupHandleHex: contact.groupHandleHex,
          hmacProofHex: contact.hmacNameHex,
          hmacRestHex: entry.hmacRestHex,
          derivationPath: entry.derivationPath,
          chainId: args.chainId,
        }),
      );
      const next: Contact = {
        ...contact,
        entries: contact.entries.map(e =>
          e === entry ? { ...e, scope: args.newLabel, hmacRestHex: result.hmacRestHex } : e,
        ),
      };
      await commit({
        contacts: { ...wallet.contacts, [contact.name]: next },
        accounts: wallet.accounts,
      });
    },
    [requireService, commit, wallet],
  );

  const renameContact = useCallback(
    async (args: RenameContactInput): Promise<Contact> => {
      const contact = lookupContact(wallet, args.oldName);
      const path = contact.entries[0]?.derivationPath;
      if (!path) throw new Error(`Contact "${contact.name}" has no entries — cannot derive path`);
      const result = await awaitDeviceAction(
        requireService().renameContact({
          oldName: args.oldName,
          newName: args.newName,
          groupHandleHex: contact.groupHandleHex,
          hmacProofHex: contact.hmacNameHex,
          derivationPath: path,
        }),
      );
      const next: Contact = {
        ...contact,
        name: args.newName,
        hmacNameHex: result.hmacNameHex,
      };
      const { [args.oldName]: _, ...rest } = wallet.contacts;
      await commit({
        contacts: { ...rest, [args.newName]: next },
        accounts: wallet.accounts,
      });
      return next;
    },
    [requireService, commit, wallet],
  );

  const addLedgerAccount = useCallback(
    async (args: AddLedgerAccountArgs): Promise<LedgerAccount> => {
      const result = await awaitDeviceAction(requireSigner().registerLedgerAccount(args));
      const next: LedgerAccount = {
        name: args.name,
        derivationPath: args.derivationPath,
        chainId: args.chainId,
        addressHex: result.addressHex,
        hmacProofHex: result.hmacProofHex,
      };
      await commit({
        contacts: wallet.contacts,
        accounts: { ...wallet.accounts, [next.name]: next },
      });
      return next;
    },
    [requireSigner, commit, wallet],
  );

  return {
    hydrated,
    wallet,
    isReady: signerEth !== null && contactsService !== null,
    addContact,
    addAddressToContact,
    editAddressLabel,
    editAddress,
    renameContact,
    addLedgerAccount,
    reset: async () => resetStore(),
  };
};
