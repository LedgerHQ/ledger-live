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
    throw err instanceof Error
      ? err
      : new Error(typeof err === "string" ? err : JSON.stringify(err));
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
  if (!contact) throw new Error(`Contact "${name}" not found in local store`);
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

  return {
    hydrated,
    wallet,
    addContact,
    addAddressToContact,
    editAddressLabel,
    editAddress,
    renameContact,
    addLedgerAccount,
    reset: async () => resetStore(),
  };
};
