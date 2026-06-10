import { useCallback, useMemo, useState } from "react";
import { useContacts } from "~/renderer/contacts/useContacts";
import type { ContactEntry } from "~/renderer/contacts/types";
import { readCryptoMeta, setCryptoMeta } from "../utils/cryptoMeta";
import {
  applyMeSuffix,
  groupContacts,
  isMeIdentity,
  ME_CONTACT_NAME,
  stripMeSuffix,
  type ContactGroup,
  type DisplayContact,
} from "../utils/groupContacts";

// Re-export so existing import paths (`ContactDetails` reads this from
// the viewmodel module) keep working. New code should pull the helper
// straight from `../utils/groupContacts`.
export { stripMeSuffix };

export type ManagementViewModel = {
  groups: ContactGroup[];
  searchQuery: string;
  selectedContactName: string;
  selectedContact: DisplayContact;
  /**
   * True when the selected contact is the special "me" identity (the
   * literal default `"me"` placeholder OR any name carrying the ` (Me)`
   * suffix). Used by `ContactDetails` to hide the Delete affordance and
   * strip the `(Me)` suffix in the edit dialog's pre-fill.
   */
  selectedContactIsMe: boolean;
  /**
   * True when the selected contact is registered on device — detected
   * via a non-empty `groupHandleHex` (the device assigns it at
   * registration; a local-only stub carries `""`). The Edit dialog uses
   * this to gate renaming behind the on-device change-name flow — a row
   * the device knows must keep its on-device name record in sync.
   */
  selectedContactRequiresDeviceConfirm: boolean;
  /** Display names that are already taken — used by Add/Edit dialogs' duplicate checks. */
  takenContactNames: string[];
  onSearchQueryChange: (next: string) => void;
  onSelectContact: (name: string) => void;
  /**
   * Create a new empty contact directly in the canonical wallet and
   * auto-select it. Caller is expected to have already validated the
   * name via the dialog (we still no-op on empties + duplicates here as
   * a belt-and-braces).
   */
  onAddContact: (name: string) => void;
  /**
   * Local-only rename — re-keys the canonical wallet from the current
   * display name to the new name (no device flow). Used for rows that
   * aren't registered on device yet (a fresh empty stub or the
   * synthesized "me", which gets materialized into the wallet on its
   * first rename). The device-backed path lives in
   * `onRenameContactOnDevice` — callers pick based on
   * `selectedContactRequiresDeviceConfirm`.
   */
  onRenameContact: (currentDisplayName: string, newName: string) => void;
  /**
   * Build the device verb that renames a registered contact through the
   * DMK change-name flow. Returns a closure that the caller hands to
   * `RunDeviceAction.run`. On success the canonical wallet is re-keyed
   * to the new name (handled inside `useContacts.renameContact`) and the
   * selection follows.
   */
  onRenameContactOnDevice: (
    currentDisplayName: string,
    newName: string,
  ) => (deviceId: string) => Promise<void>;
  /**
   * Hard-delete a contact and every trace of it:
   *   - drops the canonical wallet entry (and every address entry on it),
   *   - clears the cryptoMeta annotation keyed by each of those entries.
   *
   * Selection snaps back to "me" (always available via the synthesized
   * placeholder).
   */
  onDeleteContact: (displayName: string) => Promise<void>;
  /**
   * Drop one address from a contact's entry list. Client-side only
   * — no DMK address-removal verb ships yet. Also clears the matching
   * `cryptoMeta` annotation so the cosmetic crypto-id sidecar doesn't
   * accumulate dangling keys.
   */
  onDeleteAddress: (
    currentDisplayName: string,
    entry: { addressHex: string; chainId: number; scope: string },
  ) => Promise<void>;
  /**
   * Build the device verb for the merged "Edit address" modal, which can
   * change the address hex AND/OR the per-entry name (`scope`) in one
   * flow. Returns a closure the caller hands to `RunDeviceAction.run`.
   * The closure inspects what actually changed (vs `entry`) and routes:
   *   - address only → DMK `editAddress`
   *   - name only    → DMK `editAddressLabel`
   *   - both         → DMK register (`addAddressToContact`) for the new
   *                    (address, name), then drops the old entry locally
   *                    so the contact shows ONE modified entry (the device
   *                    has no single verb that edits both at once).
   * Every branch re-HMACs on device, so a prompt is mandatory, and each
   * migrates the cryptoMeta annotation from the old `(addr, chainId,
   * scope)` key to the new one so the entry stays in the same crypto
   * bucket post-edit.
   */
  onEditAddressOnDevice: (
    currentDisplayName: string,
    entry: ContactEntry,
    changes: { newAddressHex: string; newScope: string },
  ) => (deviceId: string) => Promise<void>;
};

/**
 * Selection + search state for the Contacts management page.
 *
 * Single source of truth: `useContacts().wallet.contacts` — the
 * canonical DMK-backed map persisted to `lld-contacts.json`. Both
 * device-registered contacts AND local-only stubs (created via the L4
 * "Add contact" dialog, `groupHandleHex === ""`) live here; there is no
 * separate sidecar / rename-overlay / tombstone storage.
 *
 * `selectedContactName` is the wallet key (== the contact's display
 * `name`). When a rename fires it re-keys the wallet and we update the
 * selection to the new name so the right pane doesn't visually unselect.
 */
export function useManagementViewModel(): ManagementViewModel {
  const contacts = useContacts();
  const { wallet } = contacts;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactName, setSelectedContactName] =
    useState<string>(ME_CONTACT_NAME);

  // Derive a `Record<name, DisplayContact>` straight off the canonical
  // wallet, attaching a `colorKey` so the avatar's background stays
  // stable across renames (see below).
  //
  // We inject a synthetic Me placeholder when no real Me-identity row
  // exists yet (no `"me"` key, no `"… (Me)"` post-rename row). The
  // placeholder is display-only — it gets materialized into the wallet
  // the first time the user renames Me (`renameLocalContact`).
  const mergedContacts = useMemo<Record<string, DisplayContact>>(() => {
    const out: Record<string, DisplayContact> = {};
    // `wallet` can be undefined for a tick under jsdom (the contacts
    // store hydrates asynchronously in an effect). Guard so the
    // viewmodel doesn't crash before hydration completes.
    const walletContacts = wallet?.contacts ?? {};
    const hasMeIdentity = Object.keys(walletContacts).some(k => isMeIdentity(k));
    const source = hasMeIdentity
      ? walletContacts
      : {
          ...walletContacts,
          [ME_CONTACT_NAME]: {
            name: ME_CONTACT_NAME,
            groupHandleHex: "",
            hmacNameHex: "",
            entries: [],
          },
        };
    for (const [name, contact] of Object.entries(source)) {
      // Stable color seed:
      //   - Me identity → always the literal `"me"` key, so Me's pastel
      //     never changes across renames / materialization.
      //   - Registered contact → its device-issued `groupHandleHex`
      //     (preserved through the on-device rename flow).
      //   - Local-only stub → its `name`. A local rename re-keys the
      //     wallet, so the seed follows the new name (and re-seeds again
      //     to `groupHandleHex` once an address is registered). This is
      //     the one place a not-yet-registered contact's color can shift.
      const colorKey = isMeIdentity(name)
        ? ME_CONTACT_NAME
        : contact.groupHandleHex || name;
      out[name] = { ...contact, name, colorKey };
    }
    return out;
  }, [wallet?.contacts]);

  const groups = useMemo(
    () => groupContacts(mergedContacts, searchQuery),
    [mergedContacts, searchQuery],
  );

  const takenContactNames = useMemo(
    () => Object.values(mergedContacts).map(c => c.name),
    [mergedContacts],
  );

  // Resolve the selected contact off the FULL merged list (ignoring the
  // search filter) so the details pane never empties just because the
  // user's query trimmed the row from the list. Fall back to the "me"
  // placeholder for the (rare) case where the selected name has been
  // removed from the wallet between renders.
  const selectedContact = useMemo<DisplayContact>(() => {
    const fromMerged = Object.values(mergedContacts).find(
      c => c.name === selectedContactName,
    );
    if (fromMerged) return fromMerged;
    // Fall back to whatever currently represents the Me identity —
    // not just the literal `"me"` placeholder. Post-rename / post-
    // promotion the row carries the ` (Me)` suffix; `isMeIdentity`
    // catches both shapes.
    const meFromMerged = Object.values(mergedContacts).find(c => isMeIdentity(c.name));
    if (meFromMerged) return meFromMerged;
    return {
      name: ME_CONTACT_NAME,
      groupHandleHex: "",
      hmacNameHex: "",
      entries: [],
      colorKey: ME_CONTACT_NAME,
    };
  }, [mergedContacts, selectedContactName]);

  // The contact is "me" when its display name matches the Me identity
  // pattern — either the literal default `"me"` placeholder OR a name
  // carrying the ` (Me)` suffix. Routing this through `isMeIdentity`
  // means the detector also fires for the post-promotion canonical
  // row (where the wallet key carries the suffix and there's no
  // rename overlay to consult).
  const selectedContactIsMe = useMemo(
    () => isMeIdentity(selectedContact.name),
    [selectedContact.name],
  );

  // True iff the selected row is registered on device — detected by a
  // non-empty `groupHandleHex` (the device assigns it at registration; a
  // local-only stub carries `""`). Used by the Edit dialog to gate
  // renaming behind the device change-name flow.
  const selectedContactRequiresDeviceConfirm = useMemo(
    () => selectedContact.groupHandleHex !== "",
    [selectedContact.groupHandleHex],
  );

  const onAddContact = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      // Defensive duplicate guard — the dialog already blocks this.
      if (Object.values(mergedContacts).some(c => c.name === trimmed)) return;
      // Write an empty contact straight into the canonical wallet so it
      // persists in `lld-contacts.json`, ready to accept its first
      // address. `commit` updates the in-memory snapshot synchronously,
      // so the new row + selection land on the same tick (the floating
      // promise just flushes to the IPC store).
      void contacts.upsertLocalContact({ name: trimmed });
      setSelectedContactName(trimmed);
    },
    [contacts, mergedContacts],
  );

  const onRenameContact = useCallback(
    (currentDisplayName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      // Protected Me identity: re-apply the ` (Me)` suffix so it
      // survives every rename. `applyMeSuffix` strips any pre-existing
      // suffix first so we never end up with `Benoit (Me) (Me)`.
      const finalName = isMeIdentity(currentDisplayName)
        ? applyMeSuffix(trimmed)
        : trimmed;
      // No-op when the resulting name matches what's already displayed.
      if (finalName === currentDisplayName) return;
      // Local re-key of the canonical wallet (no device). When the row
      // is the synthetic Me (not yet in the wallet), this materializes
      // it as an empty stub under the new name. `commit` updates the
      // snapshot synchronously, so the rename + selection land together.
      void contacts.renameLocalContact({ oldName: currentDisplayName, newName: finalName });
      setSelectedContactName(finalName);
    },
    [contacts],
  );

  // Device-backed rename. Returns a closure suitable for
  // `RunDeviceAction.run` — the EditContactDialog hands it to the
  // runner once the user submits a new name on a registered row.
  // `useContacts.renameContact` re-keys `wallet.contacts` from
  // `oldName → newName` on commit, so the merged view picks up the new
  // label. The display name IS the wallet key, so we pass it straight
  // through as `oldName`.
  const onRenameContactOnDevice = useCallback(
    (currentDisplayName: string, newName: string) =>
      async (deviceId: string): Promise<void> => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        // Mirror `onRenameContact`'s suffix logic so the device-side
        // entry and the wallet key both carry ` (Me)`. Without this,
        // renaming a registered Me row to "Bilson" used to commit
        // "Bilson" on device, dropping the identity marker.
        const finalName = isMeIdentity(currentDisplayName)
          ? applyMeSuffix(trimmed)
          : trimmed;
        await contacts.renameContact(deviceId, {
          oldName: currentDisplayName,
          newName: finalName,
        });
        setSelectedContactName(finalName);
      },
    [contacts],
  );

  const onEditAddressOnDevice = useCallback(
    (
      currentDisplayName: string,
      entry: ContactEntry,
      changes: { newAddressHex: string; newScope: string },
    ) =>
      async (deviceId: string): Promise<void> => {
        const newAddressHex = changes.newAddressHex.trim();
        const newScope = changes.newScope.trim();
        // Compare against the entry's current values to decide the flow.
        // Both must be non-empty (the dialog already gates this, but the
        // closure stays defensive).
        const addressChanged = newAddressHex.length > 0 && newAddressHex !== entry.addressHex;
        const scopeChanged = newScope.length > 0 && newScope !== entry.scope;
        if (!addressChanged && !scopeChanged) return; // no-op

        // cryptoMeta (cosmetic crypto-id) is keyed by `(address, chainId,
        // scope)`, so editing the address and/or name moves the key. We
        // migrate the annotation so the entry keeps its crypto icon.
        const existingCrypto = readCryptoMeta(entry.addressHex, entry.chainId, entry.scope);
        const finalAddress = addressChanged ? newAddressHex : entry.addressHex;
        const finalScope = scopeChanged ? newScope : entry.scope;
        const hasAnnotation = existingCrypto !== undefined;

        // Pre-seed the NEW key BEFORE the device commit. Each device verb
        // commits the wallet internally, which re-renders the details pane;
        // if the new cryptoMeta key isn't in place yet, that render groups
        // the now-edited entry under the chain-native crypto (e.g. ETH) and
        // the icon flips. Writing the new key first means the entry already
        // resolves to its crypto the instant the wallet flips — no flicker,
        // no stuck fallback. The old key is left in place until success
        // (the old entry still uses it during the device prompt).
        if (hasAnnotation) {
          setCryptoMeta(finalAddress, entry.chainId, finalScope, existingCrypto);
        }

        try {
          if (addressChanged && !scopeChanged) {
            // Address only → DMK editAddress (keeps the scope).
            await contacts.editAddress(deviceId, {
              contactName: currentDisplayName,
              oldAddressHex: entry.addressHex,
              newAddressHex,
              chainId: entry.chainId,
            });
          } else if (!addressChanged && scopeChanged) {
            // Name only → DMK editAddressLabel (keeps the address).
            await contacts.editAddressLabel(deviceId, {
              contactName: currentDisplayName,
              addressHex: entry.addressHex,
              oldLabel: entry.scope,
              newLabel: newScope,
              chainId: entry.chainId,
            });
          } else {
            // Both changed → no single device verb edits address + name at
            // once, so we register the new (address, name) and drop the old
            // entry. This MUST be one atomic commit: doing
            // `addAddressToContact` then `removeAddressFromContact` as two
            // separate verbs clobbers itself (both capture the same pre-add
            // `wallet` snapshot, so the removal's commit overwrites the add
            // and the new address vanishes locally). `replaceAddress` does
            // both in a single commit. One device confirmation (the register).
            await contacts.replaceAddress(deviceId, {
              contactName: currentDisplayName,
              oldEntry: {
                addressHex: entry.addressHex,
                chainId: entry.chainId,
                scope: entry.scope,
              },
              newAddressHex,
              newScope,
              derivationPath: entry.derivationPath,
              chainId: entry.chainId,
            });
          }
        } catch (err) {
          // Device failed / user cancelled — the wallet entry didn't change,
          // so revert the optimistic new-key write (unless it happens to be
          // the same key as the still-valid old one). Re-throw so
          // `RunDeviceAction` surfaces the error.
          if (hasAnnotation && !(finalAddress === entry.addressHex && finalScope === entry.scope)) {
            setCryptoMeta(finalAddress, entry.chainId, finalScope, undefined);
          }
          throw err;
        }

        // Success → the entry no longer uses the old key, so clear it
        // (unless old and new keys coincide).
        if (hasAnnotation && !(finalAddress === entry.addressHex && finalScope === entry.scope)) {
          setCryptoMeta(entry.addressHex, entry.chainId, entry.scope, undefined);
        }
      },
    [contacts],
  );

  const onDeleteAddress = useCallback(
    async (
      currentDisplayName: string,
      entry: { addressHex: string; chainId: number; scope: string },
    ): Promise<void> => {
      // The canonical wallet is keyed by the contact's name, which is
      // exactly the display name (no overlay indirection).
      await contacts.removeAddressFromContact({
        contactName: currentDisplayName,
        entry,
      });
      // Drop the cosmetic crypto-id annotation for this entry so the
      // sidecar doesn't accumulate dangling keys. The grouping reader
      // would otherwise still hash the now-deleted entry to its old
      // bucket if it ever reappeared (it won't, but cleanliness).
      setCryptoMeta(entry.addressHex, entry.chainId, entry.scope, undefined);
    },
    [contacts],
  );

  const onDeleteContact = useCallback(
    async (displayName: string): Promise<void> => {
      // The Me identity is protected — it can be renamed but never
      // deleted. Routed through `isMeIdentity` so the guard fires for
      // both the default `"me"` placeholder AND a materialized row whose
      // wallet key carries the ` (Me)` suffix.
      if (isMeIdentity(displayName)) return;

      // 1) Clear the cryptoMeta annotation for every entry on the
      //    contact (the cosmetic crypto-id sidecar keyed by
      //    `(addressHex, chainId, scope)`). Read the wallet entry
      //    BEFORE we drop it.
      const canonical = wallet?.contacts?.[displayName];
      if (canonical) {
        for (const e of canonical.entries) {
          setCryptoMeta(e.addressHex, e.chainId, e.scope, undefined);
        }
      }

      // 2) Drop the wallet entry (and every address on it). This is the
      //    only contact store now, so the contact is fully gone — a
      //    future re-add of the same name lands cleanly.
      await contacts.removeContact({ contactName: displayName });

      // 3) Snap selection back to "me" (always available via the
      //    synthesized placeholder).
      setSelectedContactName(ME_CONTACT_NAME);
    },
    [contacts, wallet?.contacts],
  );

  return {
    groups,
    searchQuery,
    selectedContactName,
    selectedContact,
    selectedContactIsMe,
    selectedContactRequiresDeviceConfirm,
    takenContactNames,
    onSearchQueryChange: setSearchQuery,
    onSelectContact: setSelectedContactName,
    onAddContact,
    onRenameContact,
    onRenameContactOnDevice,
    onDeleteContact,
    onDeleteAddress,
    onEditAddressOnDevice,
  };
}
