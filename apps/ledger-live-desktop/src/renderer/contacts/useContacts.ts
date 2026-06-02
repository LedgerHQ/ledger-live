import { useCallback } from "react";
import { firstValueFrom, from, lastValueFrom, type Observable } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { isDmkTransport } from "@ledgerhq/live-common/hw/dmkUtils";
import type Transport from "@ledgerhq/hw-transport";
import {
  ContactsServiceBuilder,
  DeviceActionStatus,
  type DeviceActionState,
  type DeviceManagementKit,
  type EditExternalAddressLabelArgs,
  type RenameContactArgs,
} from "@ledgerhq/device-management-kit";
import {
  SignerEthBuilder,
  type EditExternalAddressArgs,
  type RegisterExternalAddressArgs,
  type RegisterLedgerAccountArgs,
} from "@ledgerhq/device-signer-kit-ethereum";
import { useContactsStore } from "./hooks";
import { extractErrorMessage } from "./deviceErrors";
import type { Contact, ContactEntry, ContactsWallet, LedgerAccount } from "./types";

/**
 * Stable boundary contract for the Contacts feature.
 *
 * Each verb takes a `deviceId` and opens its own short-lived transport via
 * live-common's `withDevice`, so the DMK session lifecycle matches every
 * other device-bound flow in LWD (Receive, Send). The transport closes
 * automatically when the verb resolves, which keeps the runtime free of
 * orphaned scans / sessions between calls.
 *
 * Callers are expected to first ground the device in the right state — i.e.
 * "Ethereum app is open" — via the canonical `<DeviceAction>` (typically
 * driven by `useConnectAppAction`). Once that resolves, the verb here picks
 * up the DMK-backed transport and runs the action.
 */
export type UseContacts = {
  hydrated: boolean;
  wallet: ContactsWallet;

  addContact: (deviceId: string, args: AddContactArgs) => Promise<Contact>;
  addAddressToContact: (
    deviceId: string,
    args: AddAddressToContactArgs,
  ) => Promise<Contact>;
  editAddressLabel: (deviceId: string, args: EditAddressLabelInput) => Promise<void>;
  editAddress: (deviceId: string, args: EditAddressInput) => Promise<void>;
  renameContact: (deviceId: string, args: RenameContactInput) => Promise<Contact>;
  addLedgerAccount: (
    deviceId: string,
    args: AddLedgerAccountArgs,
  ) => Promise<LedgerAccount>;
  /**
   * Remove one address entry from a contact. Client-side only — there
   * is no DMK address-removal verb yet, so this purely rewrites the
   * local wallet snapshot. The on-device entry technically lingers
   * until DMK ships the removal command; for L4 the user-visible row
   * disappears, which is what the demo cares about.
   *
   * No-op when the contact doesn't exist or the matching entry isn't
   * found — keeps callers simple.
   */
  removeAddressFromContact: (args: RemoveAddressFromContactArgs) => Promise<void>;
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
export type RemoveAddressFromContactArgs = {
  /** Canonical wallet key (the device-side name). */
  contactName: string;
  /** Identifies the entry to drop. */
  entry: Pick<ContactEntry, "addressHex" | "chainId" | "scope">;
};


/**
 * Wait for the observable to complete, then resolve on the *final* state.
 *
 * DMK actions can emit transient `Error` states mid-flight (e.g. an
 * unrecognized intermediate status word while the device is mid-prompt) that
 * are corrected by a subsequent `Pending` → `Completed` sequence once the
 * user actually validates. Treating the first `Error` event as terminal would
 * therefore reject perfectly successful operations. `lastValueFrom` waits for
 * the observable's natural completion, and we only decide from the last value
 * — matching the DMK sample's `state.status === completed | error` switch
 * (`device-sdk-ts/.../external-addresses/RegisterExternalAddressForm.tsx`).
 */
const finalize = async <Output>(returnType: {
  observable: Observable<DeviceActionState<Output, unknown, unknown>>;
}): Promise<Output> => {
  const final = await lastValueFrom(returnType.observable);
  if (final.status === DeviceActionStatus.Completed) return final.output;
  if (final.status === DeviceActionStatus.Error) {
    const err = final.error as unknown;
    // Real Error → rethrow as-is so stacks survive.
    if (err instanceof Error) throw err;
    // DMK tagged-object errors (e.g. `EthAppCommandError`) aren't Error
    // instances. Wrap into a proper Error and copy the relevant
    // discriminators so callers (UI) can still tell, e.g., a user-cancel
    // (`errorCode === "6982"`) apart from a real failure without parsing
    // the message string.
    const enriched = new Error(extractErrorMessage(err));
    if (err && typeof err === "object") {
      const rec = err as Record<string, unknown>;
      if ("errorCode" in rec) (enriched as Error & { errorCode?: unknown }).errorCode = rec.errorCode;
      if ("_tag" in rec) (enriched as Error & { _tag?: unknown })._tag = rec._tag;
    }
    throw enriched;
  }
  throw new Error(`Device action ended with status: ${final.status}`);
};

/**
 * Open a DMK transport for the given device, hand it to `fn`, and close it
 * automatically. Mirrors `withDevicePromise` but enforces the DMK transport —
 * contacts ops are DMK-only and we want a clear error otherwise.
 */
const withDmk = <T>(
  deviceId: string,
  fn: (deps: { dmk: DeviceManagementKit; sessionId: string }) => Promise<T>,
): Promise<T> =>
  firstValueFrom(
    withDevice(deviceId)((transport: Transport) => {
      if (!isDmkTransport(transport)) {
        return from(
          Promise.reject(
            new Error("Contacts operations require the DMK transport (ldmkConnectApp)."),
          ),
        );
      }
      return from(fn({ dmk: transport.dmk, sessionId: transport.sessionId }));
    }),
  );

const lookupContact = (wallet: ContactsWallet, name: string): Contact => {
  const contact = wallet.contacts[name];
  if (!contact)
    throw new Error(
      `Contact "${name}" is not registered on device — use addContact first`,
    );
  return contact;
};

const lookupEntry = (contact: Contact, addressHex: string): ContactEntry => {
  const entry = contact.entries.find(e => e.addressHex === addressHex);
  if (!entry) throw new Error(`Address ${addressHex} not found on contact "${contact.name}"`);
  return entry;
};

const buildSigner = (deps: { dmk: DeviceManagementKit; sessionId: string }) =>
  new SignerEthBuilder({ ...deps, originToken: "ledger-wallet-desktop" }).build();

const buildContactsService = (deps: { dmk: DeviceManagementKit; sessionId: string }) =>
  new ContactsServiceBuilder(deps).build();

export const useContacts = (): UseContacts => {
  const { hydrated, wallet, commit, reset: resetStore } = useContactsStore();

  const addContact = useCallback(
    (deviceId: string, args: AddContactArgs): Promise<Contact> =>
      withDmk(deviceId, async deps => {
        const result = await finalize(buildSigner(deps).registerExternalAddress(args));
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
      }),
    [commit, wallet],
  );

  const addAddressToContact = useCallback(
    (deviceId: string, args: AddAddressToContactArgs): Promise<Contact> =>
      withDmk(deviceId, async deps => {
        const existing = lookupContact(wallet, args.contactName);
        const result = await finalize(
          buildSigner(deps).registerExternalAddress({
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
      }),
    [commit, wallet],
  );

  const editAddress = useCallback(
    (deviceId: string, args: EditAddressInput): Promise<void> =>
      withDmk(deviceId, async deps => {
        const contact = lookupContact(wallet, args.contactName);
        const entry = lookupEntry(contact, args.oldAddressHex);
        const result = await finalize(
          buildSigner(deps).editExternalAddress({
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
      }),
    [commit, wallet],
  );

  const editAddressLabel = useCallback(
    (deviceId: string, args: EditAddressLabelInput): Promise<void> =>
      withDmk(deviceId, async deps => {
        const contact = lookupContact(wallet, args.contactName);
        const entry = lookupEntry(contact, args.addressHex);
        const result = await finalize(
          buildContactsService(deps).editExternalAddressLabel({
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
      }),
    [commit, wallet],
  );

  const renameContact = useCallback(
    (deviceId: string, args: RenameContactInput): Promise<Contact> =>
      withDmk(deviceId, async deps => {
        const contact = lookupContact(wallet, args.oldName);
        const path = contact.entries[0]?.derivationPath;
        if (!path)
          throw new Error(`Contact "${contact.name}" has no entries — cannot derive path`);
        const result = await finalize(
          buildContactsService(deps).renameContact({
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
        const { [args.oldName]: _omit, ...rest } = wallet.contacts;
        await commit({
          contacts: { ...rest, [args.newName]: next },
          accounts: wallet.accounts,
        });
        return next;
      }),
    [commit, wallet],
  );

  const addLedgerAccount = useCallback(
    (deviceId: string, args: AddLedgerAccountArgs): Promise<LedgerAccount> =>
      withDmk(deviceId, async deps => {
        const result = await finalize(buildSigner(deps).registerLedgerAccount(args));
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
      }),
    [commit, wallet],
  );

  const removeAddressFromContact = useCallback(
    async ({ contactName, entry }: RemoveAddressFromContactArgs): Promise<void> => {
      // `wallet` can be undefined for a tick under jsdom (the
      // contacts store hydrates asynchronously). Treat that as a
      // no-op — same defensive shape the L4 viewmodel uses.
      const existing = wallet?.contacts?.[contactName];
      if (!existing) return;
      // Identify the doomed entry by `(addressHex, chainId, scope)` —
      // the same triple cryptoMeta uses, and the most specific tuple
      // available without going through the hmac fingerprint (which
      // the caller often doesn't have on hand).
      const next: Contact = {
        ...existing,
        entries: existing.entries.filter(
          e =>
            !(
              e.addressHex === entry.addressHex &&
              e.chainId === entry.chainId &&
              e.scope === entry.scope
            ),
        ),
      };
      // Nothing changed → skip the commit.
      if (next.entries.length === existing.entries.length) return;
      await commit({
        contacts: { ...(wallet?.contacts ?? {}), [contactName]: next },
        accounts: wallet?.accounts ?? {},
      });
    },
    [commit, wallet],
  );

  return {
    hydrated,
    wallet,
    addContact,
    addAddressToContact,
    editAddressLabel,
    editAddress,
    renameContact,
    addLedgerAccount,
    removeAddressFromContact,
    reset: async () => resetStore(),
  };
};
