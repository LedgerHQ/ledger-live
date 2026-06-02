import { useCallback, useMemo, useState } from "react";
import { useContacts } from "~/renderer/contacts/useContacts";
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
import {
  addSidecarContact,
  useSidecarContacts,
} from "../utils/sidecarContacts";
import {
  clearContactDeleted,
  clearContactRename,
  markContactDeleted,
  setContactRename,
  useContactRenames,
  useDeletedContacts,
} from "../utils/sidecarOverrides";

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
   * True when the selected contact resolves (via the rename overlay)
   * to the special "me" identity. Used by `ContactDetails` to hide
   * the Delete affordance and strip the `(Me)` suffix in the edit
   * dialog's pre-fill.
   */
  selectedContactIsMe: boolean;
  /**
   * True when the selected contact has at least one address registered
   * on device (i.e. a canonical entry exists in `wallet.contacts` under
   * its underlying name). The Edit dialog uses this to gate renaming
   * behind the on-device change-name flow — renaming a row that the
   * device knows must keep the on-device label in sync.
   */
  selectedContactRequiresDeviceConfirm: boolean;
  /** Display names that are already taken — used by Add/Edit dialogs' duplicate checks. */
  takenContactNames: string[];
  onSearchQueryChange: (next: string) => void;
  onSelectContact: (name: string) => void;
  /**
   * Add a new (sidecar-backed) contact and auto-select it. Caller is
   * expected to have already validated the name via the dialog (we
   * still no-op on empties + duplicates here as a belt-and-braces).
   */
  onAddContact: (name: string) => void;
  /**
   * Local-only rename. Adds a `sidecarOverrides` rename entry mapping
   * the underlying name → display name and updates the selection.
   * Used for rows that don't have an on-device entry yet (sidecar-only,
   * synthesized "me", or renamed sidecar). The device-backed path lives
   * in `onRenameContactOnDevice` — callers pick based on
   * `selectedContactRequiresDeviceConfirm`.
   */
  onRenameContact: (currentDisplayName: string, newName: string) => void;
  /**
   * Build the device verb that renames a canonical contact through the
   * DMK change-name flow. Returns a closure that the caller hands to
   * `RunDeviceAction.run`. On success the canonical wallet is re-keyed
   * to the new name (handled inside `useContacts.renameContact`), the
   * selection follows, and any now-stale rename overlay entry is dropped.
   */
  onRenameContactOnDevice: (
    currentDisplayName: string,
    newName: string,
  ) => (deviceId: string) => Promise<void>;
  /**
   * Delete a contact from the displayed list. Adds the underlying name
   * to the `sidecarOverrides` deleted set. Selection snaps back to "me"
   * (which always renders thanks to the synthesized placeholder).
   */
  onDeleteContact: (displayName: string) => void;
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
   * Build the device verb that renames one address entry's per-entry
   * label (`scope`) via DMK's `editAddressLabel`. Returns a closure
   * the caller hands to `RunDeviceAction.run`. Renaming a label
   * regenerates the on-device HMAC, so the prompt is mandatory.
   *
   * On the verb's success the wallet snapshot already carries the
   * new `scope` (via `useContacts.editAddressLabel`'s internal
   * commit); we ALSO migrate the cryptoMeta annotation under the
   * new scope so the entry stays grouped under the same crypto.
   */
  onRenameAddressLabelOnDevice: (
    currentDisplayName: string,
    entry: { addressHex: string; chainId: number; scope: string },
    newScope: string,
  ) => (deviceId: string) => Promise<void>;
};

/**
 * Selection + search state for the Contacts management page.
 *
 * Reads:
 *   - `useContacts().wallet.contacts` — canonical DMK-backed map.
 *   - `useSidecarContacts()` — sidecar-only contacts created via the
 *     L4 "Add contact" Dialog.
 *   - `useContactRenames()` — `underlyingName → displayName` overlay.
 *   - `useDeletedContacts()` — names hidden from the view.
 *
 * Merge order: canonical first, sidecar last → sidecar wins on name
 * collision. Rename overlay is then applied, so every consumer sees
 * the post-rename display name. Deleted set filters at the end.
 *
 * `selectedContactName` lives in DISPLAY space (post-rename). When a
 * rename fires, we update it to the new value so the right pane
 * doesn't visually unselect.
 *
 * Same caveats as the other sidecars: strictly violates the
 * `docs/contacts.md` "no second storage path" rule; demo-only.
 */
export function useManagementViewModel(): ManagementViewModel {
  const contacts = useContacts();
  const { wallet } = contacts;
  const sidecar = useSidecarContacts();
  const renames = useContactRenames();
  const deleted = useDeletedContacts();

  // Reverse the rename overlay: given a row's current display name,
  // return the key it lives under in the canonical wallet / sidecar.
  // Shared between the device-rename verb and the
  // `requiresDeviceConfirm` check so both stay in lockstep.
  const resolveUnderlying = useCallback(
    (displayName: string): string =>
      Object.entries(renames).find(([, dn]) => dn === displayName)?.[0] ??
      displayName,
    [renames],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactName, setSelectedContactName] =
    useState<string>(ME_CONTACT_NAME);

  // Canonical + sidecar merge. Apply renames → derive a final
  // `Record<displayName, DisplayContact>` with each entry's `name`
  // rewritten to the display name AND a `colorKey` field attached so
  // the avatar's background stays pinned across renames. Filter out
  // deleted names AFTER the rename (so deletion can target either the
  // underlying or the display name — both work because renames are
  // applied first).
  //
  // We also inject a synthetic Me placeholder into the source when
  // no real Me-identity row exists yet (no `"me"` in wallet, no
  // `"… (Me)"` post-promotion row). Without this, renaming the
  // default Me row writes `renames["me"] = "brian (Me)"` to storage
  // but the overlay never gets applied — there's no source entry
  // keyed by `"me"` for the loop below to rewrite. `groupContacts`'s
  // own synthesis kicks in too late: it sees the merge missing Me
  // and rebuilds the default placeholder, throwing away the rename.
  const mergedContacts = useMemo<Record<string, DisplayContact>>(() => {
    const out: Record<string, DisplayContact> = {};
    // `wallet` can be undefined for a tick under jsdom (the contacts
    // store hydrates asynchronously in an effect). Guard so the
    // viewmodel doesn't crash before hydration completes.
    const walletContacts = wallet?.contacts ?? {};
    const baseSource = { ...walletContacts, ...sidecar };
    const hasMeIdentity = Object.keys(baseSource).some(k => isMeIdentity(k));
    const source = hasMeIdentity
      ? baseSource
      : {
          ...baseSource,
          [ME_CONTACT_NAME]: {
            name: ME_CONTACT_NAME,
            groupHandleHex: "",
            hmacNameHex: "",
            entries: [],
          },
        };
    for (const [underlying, contact] of Object.entries(source)) {
      if (deleted[underlying]) continue;
      const displayName = renames[underlying] ?? underlying;
      if (deleted[displayName]) continue;
      // Stable color seed. Priority: device-issued group handle (won't
      // change for the lifetime of the contact), falling back to the
      // underlying sidecar / Me key (stable across every L4 rename
      // overlay). Either way the avatar's pastel survives every
      // user-visible rename path.
      const colorKey = contact.groupHandleHex || underlying;
      out[displayName] = { ...contact, name: displayName, colorKey };
    }
    return out;
  }, [wallet?.contacts, sidecar, renames, deleted]);

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

  // True iff the selected row has at least one address registered on
  // device. The canonical wallet's keys are always the device-side
  // names; reverse the rename overlay first so renamed rows resolve to
  // their underlying key. Used by the Edit dialog to gate renaming
  // behind the device change-name flow.
  const selectedContactRequiresDeviceConfirm = useMemo(
    () => resolveUnderlying(selectedContact.name) in (wallet?.contacts ?? {}),
    [resolveUnderlying, selectedContact.name, wallet?.contacts],
  );

  const onAddContact = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      // Defensive duplicate guard — the dialog already blocks this.
      if (Object.values(mergedContacts).some(c => c.name === trimmed)) return;
      // Lift any deletion tombstone for this name before adding. The
      // merge filters every entry against `deleted[name]`, so without
      // this a contact previously deleted then recreated with the
      // same label would be silently filtered out and the user would
      // see nothing land in the list.
      clearContactDeleted(trimmed);
      addSidecarContact(trimmed);
      setSelectedContactName(trimmed);
    },
    [mergedContacts],
  );

  const onRenameContact = useCallback(
    (currentDisplayName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      const underlying = resolveUnderlying(currentDisplayName);
      // Protected Me identity: re-apply the ` (Me)` suffix so it
      // survives every rename. `applyMeSuffix` strips any pre-existing
      // suffix first so we never end up with `Benoit (Me) (Me)`.
      const finalName = isMeIdentity(underlying) ? applyMeSuffix(trimmed) : trimmed;
      // No-op when the resulting name matches what's already displayed.
      if (finalName === currentDisplayName) return;
      setContactRename(underlying, finalName);
      // Snap selection to the new display name so the right pane
      // doesn't unselect.
      setSelectedContactName(finalName);
    },
    [resolveUnderlying],
  );

  // Device-backed rename. Returns a closure suitable for
  // `RunDeviceAction.run` — the EditContactDialog hands it to the
  // runner once the user submits a new name on a canonical row.
  // `useContacts.renameContact` re-keys `wallet.contacts` from
  // `oldName → newName` on commit, so the merged view picks up the
  // new label without needing an overlay. We still snap the selection
  // and drop any stale rename overlay entry as a defensive cleanup.
  const onRenameContactOnDevice = useCallback(
    (currentDisplayName: string, newName: string) =>
      async (deviceId: string): Promise<void> => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        const underlying = resolveUnderlying(currentDisplayName);
        // Mirror `onRenameContact`'s suffix logic so the device-side
        // entry and the post-promotion wallet key both carry ` (Me)`.
        // Without this, renaming a promoted Me row to "Bilson" used to
        // commit "Bilson" on device, dropping the identity marker.
        const finalName = isMeIdentity(underlying) ? applyMeSuffix(trimmed) : trimmed;
        await contacts.renameContact(deviceId, {
          oldName: underlying,
          newName: finalName,
        });
        setSelectedContactName(finalName);
        clearContactRename(underlying);
      },
    [contacts, resolveUnderlying],
  );

  const onRenameAddressLabelOnDevice = useCallback(
    (
      currentDisplayName: string,
      entry: { addressHex: string; chainId: number; scope: string },
      newScope: string,
    ) =>
      async (deviceId: string): Promise<void> => {
        const trimmed = newScope.trim();
        if (!trimmed || trimmed === entry.scope) return;
        const underlying = resolveUnderlying(currentDisplayName);
        // Snapshot the existing cryptoMeta annotation BEFORE the
        // device call. The wallet entry's `scope` flips inside
        // `useContacts.editAddressLabel`'s commit on success, so a
        // post-success read by the old scope would return undefined.
        const existingCrypto = readCryptoMeta(
          entry.addressHex,
          entry.chainId,
          entry.scope,
        );
        await contacts.editAddressLabel(deviceId, {
          contactName: underlying,
          addressHex: entry.addressHex,
          oldLabel: entry.scope,
          newLabel: trimmed,
          chainId: entry.chainId,
        });
        // Migrate the cryptoMeta annotation under the new scope so
        // the entry stays in the same crypto bucket after rename.
        // Skipped when no annotation existed (fallback to chain-native
        // still works).
        if (existingCrypto !== undefined) {
          setCryptoMeta(entry.addressHex, entry.chainId, entry.scope, undefined);
          setCryptoMeta(entry.addressHex, entry.chainId, trimmed, existingCrypto);
        }
      },
    [contacts, resolveUnderlying],
  );

  const onDeleteAddress = useCallback(
    async (
      currentDisplayName: string,
      entry: { addressHex: string; chainId: number; scope: string },
    ): Promise<void> => {
      // The canonical wallet is keyed by the contact's device-side
      // name. Reverse any L4 rename overlay so we look up the right
      // bucket — same dance as `onRenameContactOnDevice`.
      const underlying = resolveUnderlying(currentDisplayName);
      await contacts.removeAddressFromContact({
        contactName: underlying,
        entry,
      });
      // Drop the cosmetic crypto-id annotation for this entry so the
      // sidecar doesn't accumulate dangling keys. The grouping reader
      // would otherwise still hash the now-deleted entry to its old
      // bucket if it ever reappeared (it won't, but cleanliness).
      setCryptoMeta(entry.addressHex, entry.chainId, entry.scope, undefined);
    },
    [contacts, resolveUnderlying],
  );

  const onDeleteContact = useCallback(
    (displayName: string) => {
      const underlying = resolveUnderlying(displayName);
      // The Me identity is protected — it can be renamed but never
      // deleted. Routed through `isMeIdentity` so the guard fires for
      // both the default `"me"` placeholder AND a promoted row whose
      // canonical key carries the ` (Me)` suffix.
      if (isMeIdentity(underlying)) return;
      // Mark BOTH the underlying name and the current display name as
      // deleted, so the filter catches it regardless of which side of
      // the rename overlay the row is using.
      markContactDeleted(underlying);
      if (underlying !== displayName) markContactDeleted(displayName);
      // Snap selection back to "me" (always available via the
      // synthesized placeholder).
      setSelectedContactName(ME_CONTACT_NAME);
    },
    [resolveUnderlying],
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
    onRenameAddressLabelOnDevice,
  };
}
