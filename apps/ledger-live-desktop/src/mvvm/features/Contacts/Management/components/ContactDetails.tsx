import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  IconButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactEntry } from "~/renderer/contacts/types";
import type { CryptoOption } from "~/mvvm/features/Contacts/constants/topCryptos";
import type { DisplayContact } from "../utils/groupContacts";
import { groupAddressesByCrypto } from "../utils/groupAddressesByCrypto";
import { useCryptoMeta } from "../utils/cryptoMeta";
import { stripMeSuffix } from "../hooks/useManagementViewModel";
import { AddAddressDialog } from "./AddAddressDialog";
import { AddressDetailDialog } from "./AddressDetailDialog";
import { AddressRow } from "./AddressRow";
import { ContactMenu } from "./ContactMenu";
import { DeleteAddressDialog } from "./DeleteAddressDialog";
import { DeleteContactDialog } from "./DeleteContactDialog";
import { EditContactDialog } from "./EditContactDialog";
import { EditAddressDialog } from "./EditAddressDialog";
import { EmptyAddressState } from "./EmptyAddressState";
import { InitialsAvatar } from "./InitialsAvatar";
import { RenameAddressDialog } from "./RenameAddressDialog";

type Props = {
  contact: DisplayContact;
  /** Other display names — used by EditContactDialog's duplicate check. */
  takenContactNames: string[];
  /** Whether the selected contact is the protected "me" identity. */
  isMe: boolean;
  /**
   * True when the displayed contact has at least one address registered
   * on device — the rename must then run through the DMK change-name
   * flow rather than the local overlay.
   */
  requiresDeviceConfirm: boolean;
  /** Rename the displayed contact locally (no device). Used when `requiresDeviceConfirm` is false. */
  onRenameContact: (currentDisplayName: string, newName: string) => void;
  /** Verb factory for the on-device rename flow. Used when `requiresDeviceConfirm` is true. */
  onRenameContactOnDevice: (
    currentDisplayName: string,
    newName: string,
  ) => (deviceId: string) => Promise<void>;
  /** Delete the displayed contact. Forwarded from the viewmodel. */
  onDeleteContact: (displayName: string) => void;
  /**
   * Drop one address entry from the displayed contact. Forwarded from
   * the viewmodel; fires once the user confirms in `DeleteAddressDialog`.
   */
  onDeleteAddress: (
    currentDisplayName: string,
    entry: { addressHex: string; chainId: number; scope: string },
  ) => Promise<void>;
  /**
   * Verb factory for the on-device rename of an address label. Used
   * by `RenameAddressDialog` to drive `RunDeviceAction` once the user
   * submits a new value.
   */
  onRenameAddressLabelOnDevice: (
    currentDisplayName: string,
    entry: { addressHex: string; chainId: number; scope: string },
    newScope: string,
  ) => (deviceId: string) => Promise<unknown>;
  /**
   * Verb factory for the on-device address edit. Used by
   * `EditAddressDialog` to drive `RunDeviceAction` once the user
   * submits a new hex.
   */
  onEditAddressOnDevice: (
    currentDisplayName: string,
    entry: { addressHex: string; chainId: number; scope: string },
    newAddressHex: string,
  ) => (deviceId: string) => Promise<unknown>;
};

/**
 * Right pane of the Contacts management page.
 *
 * Layout (matches Figma frame 13802:2833):
 * - Outer container: rounded `bg-surface` panel with vertical stack,
 *   gap 32, padding 16/32.
 * - Header block (centered): large `InitialsAvatar` (72px) + name in
 *   `heading-3-semi-bold` + pluralized address-count in `body-2` text-muted.
 * - Top-right corner: two `IconButton`s (Plus + MoreHorizontal). Both
 *   intentionally non-wired in L4 — Lumen's hover/press states still
 *   render because we omit `disabled` and `onClick`. Wiring lands in L4.1.
 * - Address sections: grouped by CRYPTO (USDC, ETH, …) via
 *   `groupAddressesByCrypto`, which reads the sidecar `cryptoMeta`
 *   store (DEMO-only — see `utils/cryptoMeta.ts`) and falls back to
 *   each entry's chain-native gas token. Section header shows the
 *   crypto ticker; rows carry the crypto's icon with a chain dot
 *   badge in the corner.
 *
 * Dialog open state lives here so a single dialog instance handles every
 * row in the pane.
 *
 * If the selected contact has zero entries (e.g. the synthetic "me"
 * placeholder), the address sections are suppressed entirely — the empty
 * state lands in a follow-up.
 */
export function ContactDetails({
  contact,
  takenContactNames,
  isMe,
  requiresDeviceConfirm,
  onRenameContact,
  onRenameContactOnDevice,
  onDeleteContact,
  onDeleteAddress,
  onRenameAddressLabelOnDevice,
  onEditAddressOnDevice,
}: Props) {
  const { t } = useTranslation();
  const count = contact.entries.length;
  // Subscribe once at the parent so each AddressRow's grouping
  // re-renders whenever the sidecar is updated (e.g. after registering
  // a new address via the L1 form).
  const cryptoMeta = useCryptoMeta();
  const sections = useMemo(
    () => groupAddressesByCrypto(contact.entries, cryptoMeta),
    [contact.entries, cryptoMeta],
  );

  // `null` = closed; otherwise carries the entry whose detail dialog
  // is showing AND the crypto it was grouped under (so the dialog can
  // render the matching centre icon + network badge without having to
  // re-resolve from `cryptoMeta`). We keep the previous selection in
  // state while the dialog is animating out so the body still has data
  // to render — Lumen's `onOpenChange(false)` just clears it on the
  // next commit.
  type ActiveSelection = { entry: ContactEntry; crypto: CryptoOption };
  const [active, setActive] = useState<ActiveSelection | null>(null);
  const activeEntry = active?.entry ?? null;

  // Open state for the Add-Address Dialog flow — triggered by either
  // the `+` IconButton (top-right) or the empty-state CTA. The dialog
  // itself owns the step machine; we just toggle visibility.
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const openAddAddress = () => setAddAddressOpen(true);

  // Open state for the Edit-Contact rename Dialog. The dialog itself
  // pre-fills the current name; on submit it bubbles the new name
  // back into the viewmodel via `onRenameContact`.
  const [editContactOpen, setEditContactOpen] = useState(false);

  // Open state for the Delete-Contact confirmation Dialog. Gating the
  // destructive action behind a confirm prevents an accidental click
  // on the overflow menu from wiping all of the contact's addresses
  // in one shot (Figma frame 13909:13408).
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);

  // The single address entry whose Delete confirmation is currently
  // open. Carries the actual entry so the parent can wire the
  // post-confirm action later — L4 has no DMK remove-address verb
  // yet, so the dialog is a UX-only gate today (Figma `14152:14729`).
  const [pendingAddressDelete, setPendingAddressDelete] =
    useState<ContactEntry | null>(null);

  // The single address entry currently in the Rename-address dialog.
  // Opens from either the per-row overflow menu or the AddressDetail
  // dialog's "Rename" tile (Figma frames `14182:12897` / `14151:11140`).
  //
  // `returnTo` remembers the AddressDetail selection AT THE MOMENT the
  // user clicked Rename from inside it. Set only when the entry point
  // is AddressDetail — used to render the back arrow on the header
  // and to restore the source dialog on click. `null` for opens from
  // the row's overflow menu / right-click (no surface to back into).
  type PendingAddressEdit = {
    entry: ContactEntry;
    returnTo: ActiveSelection | null;
  };
  const [pendingAddressRename, setPendingAddressRename] =
    useState<PendingAddressEdit | null>(null);
  const openRenameAddress = (entry: ContactEntry) => {
    // Triggered from the row menu — no source dialog to restore.
    setPendingAddressRename({ entry, returnTo: null });
  };
  const openRenameAddressFromDetail = (entry: ContactEntry) => {
    // Triggered from AddressDetail's Rename tile. Snapshot the
    // current `active` selection BEFORE we close it so the back
    // handler can reopen exactly the same detail dialog. We close
    // AddressDetail here as well so we don't render two stacked
    // dialogs while the rename modal is on screen.
    const snapshot = active;
    setActive(null);
    setPendingAddressRename({ entry, returnTo: snapshot });
  };

  // Same shape for the Edit dialog (Figma frames `14187:12344` /
  // `14074:12293`).
  const [pendingAddressEdit, setPendingAddressEdit] =
    useState<PendingAddressEdit | null>(null);
  const openEditAddress = (entry: ContactEntry) => {
    setPendingAddressEdit({ entry, returnTo: null });
  };
  const openEditAddressFromDetail = (entry: ContactEntry) => {
    const snapshot = active;
    setActive(null);
    setPendingAddressEdit({ entry, returnTo: snapshot });
  };
  // Delete from AddressDetail's "Delete" tile — close the detail dialog
  // and open the same confirmation modal the per-row overflow menu
  // uses. We don't thread a `returnTo` here: confirming deletes the
  // entry (so there's nothing to go back to) and cancelling simply
  // dismisses, matching the menu-triggered flow.
  const openDeleteAddressFromDetail = (entry: ContactEntry) => {
    setActive(null);
    setPendingAddressDelete(entry);
  };

  // Other display names — exclude the current contact so the dialog's
  // duplicate check treats "rename to same name" as a no-op rather
  // than a duplicate.
  const otherTakenNames = useMemo(
    () => takenContactNames.filter(n => n !== contact.name),
    [takenContactNames, contact.name],
  );

  return (
    <div
      data-testid="contacts-management-details"
      className="relative flex flex-col gap-32 h-full overflow-y-auto rounded-lg bg-surface px-16 py-32"
    >
      {/* Top-right icon buttons (absolute so they don't push the header). */}
      <div className="absolute top-16 right-16 flex items-center gap-8">
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton
              appearance="gray"
              size="sm"
              aria-label={t("contactsManagement.addAddressLabel")}
              icon={Plus}
              onClick={openAddAddress}
              data-testid="contacts-management-add-address"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t("contactsManagement.addAddressLabel")}
          </TooltipContent>
        </Tooltip>
        <ContactMenu
          onEdit={() => setEditContactOpen(true)}
          // Open the confirmation dialog instead of firing the delete
          // directly — the actual `onDeleteContact` call only runs once
          // the user confirms inside `DeleteContactDialog`.
          onDelete={() => setDeleteContactOpen(true)}
          // Protect the "me" contact from deletion. The menu hides the
          // Delete row entirely when this is false — `me` can be
          // renamed but never removed.
          canDelete={!isMe}
        />
      </div>

      {/* Centered identity block. */}
      <div className="flex flex-col items-center gap-16 w-full">
        <InitialsAvatar name={contact.name} size="lg" colorKey={contact.colorKey} />
        <div className="flex flex-col items-center gap-4 w-full text-center">
          <h2 className="heading-3-semi-bold text-base">{contact.name}</h2>
          <p className="body-2 text-muted">
            {t("contactsManagement.addresses", { count })}
          </p>
        </div>
      </div>

      {/* Empty state — surfaced when the selected contact has no
          addresses (a freshly-added sidecar contact, or the synthetic
          "me" placeholder). Figma frame 13922:11258. */}
      {count === 0 && <EmptyAddressState onAddAddress={openAddAddress} isMe={isMe} />}

      {/* Address sections grouped by crypto.
          `unknown` entries (entries with no sidecar metadata AND no
          chain-native fallback for their chainId) are filtered out —
          in normal demo flow every EVM chain in the L1 form has a
          fallback, so this should never visibly drop anything. */}
      {sections.length > 0 && (
        <div className="flex flex-col gap-24 w-full">
          {sections
            .filter(section => section.cryptoId !== "unknown")
            .map(section => {
              if (section.cryptoId === "unknown") return null; // narrow
              return (
                <div key={section.cryptoId} className="flex flex-col gap-8 w-full">
                  <p className="body-3 text-muted">{section.crypto.ticker}</p>
                  {/*
                    Figma frame 13827:32002 wraps each section's rows in a
                    `--surface-transparent` (5% white) rounded box that
                    sits as a subtle tinted card on top of the now-opaque
                    `bg-surface` details pane.
                  */}
                  <div className="flex flex-col bg-surface-transparent rounded-lg p-4">
                    {section.entries.map(entry => (
                      <AddressRow
                        key={`${entry.chainId}:${entry.addressHex}`}
                        entry={entry}
                        crypto={section.crypto}
                        onSelect={selected =>
                          setActive({ entry: selected, crypto: section.crypto })
                        }
                        onDeleteAddress={selected => setPendingAddressDelete(selected)}
                        onRenameAddress={openRenameAddress}
                        onEditAddress={openEditAddress}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <AddressDetailDialog
        open={active !== null}
        onOpenChange={isOpen => {
          if (!isOpen) setActive(null);
        }}
        contact={contact}
        entry={activeEntry}
        crypto={active?.crypto}
        // The detail dialog is the ONLY surface that should hand the
        // user a "back" arrow on the rename/edit modals — use the
        // *FromDetail helpers here so the snapshot of `active` is
        // captured BEFORE we close it.
        onRename={() => {
          if (activeEntry) openRenameAddressFromDetail(activeEntry);
        }}
        onEdit={() => {
          if (activeEntry) openEditAddressFromDetail(activeEntry);
        }}
        onDelete={() => {
          if (activeEntry) openDeleteAddressFromDetail(activeEntry);
        }}
      />

      <AddAddressDialog
        open={addAddressOpen}
        onOpenChange={setAddAddressOpen}
        contact={contact}
      />

      <EditContactDialog
        open={editContactOpen}
        onOpenChange={setEditContactOpen}
        // For the "me" contact we pre-fill the input WITHOUT the
        // " (Me)" suffix — the user only edits the part they care
        // about, and the viewmodel re-appends the suffix on submit.
        currentName={isMe ? stripMeSuffix(contact.name) : contact.name}
        takenNames={otherTakenNames}
        requiresDeviceConfirm={requiresDeviceConfirm}
        onSubmit={newName => {
          setEditContactOpen(false);
          onRenameContact(contact.name, newName);
        }}
        onDeviceRename={newName => onRenameContactOnDevice(contact.name, newName)}
      />

      <DeleteContactDialog
        open={deleteContactOpen}
        onOpenChange={setDeleteContactOpen}
        onConfirm={() => onDeleteContact(contact.name)}
      />

      <RenameAddressDialog
        open={pendingAddressRename !== null}
        onOpenChange={open => {
          if (!open) setPendingAddressRename(null);
        }}
        currentLabel={pendingAddressRename?.entry.scope ?? ""}
        onDeviceRename={newLabel =>
          // We can safely assert the entry here — the dialog only
          // calls `onDeviceRename` while it's open, and the dialog is
          // only open when `pendingAddressRename` is non-null.
          onRenameAddressLabelOnDevice(
            contact.name,
            pendingAddressRename?.entry ?? { addressHex: "", chainId: 0, scope: "" },
            newLabel,
          )
        }
        // Back arrow wires only when the rename was opened from the
        // AddressDetail dialog — `returnTo` carries the selection we
        // closed when transitioning in, and clicking back closes the
        // rename modal and re-opens AddressDetail on the same entry.
        onBack={
          pendingAddressRename?.returnTo
            ? () => {
                const restore = pendingAddressRename.returnTo;
                setPendingAddressRename(null);
                setActive(restore);
              }
            : undefined
        }
      />

      <EditAddressDialog
        open={pendingAddressEdit !== null}
        onOpenChange={open => {
          if (!open) setPendingAddressEdit(null);
        }}
        currentAddressHex={pendingAddressEdit?.entry.addressHex ?? ""}
        onDeviceEdit={newAddressHex =>
          onEditAddressOnDevice(
            contact.name,
            pendingAddressEdit?.entry ?? { addressHex: "", chainId: 0, scope: "" },
            newAddressHex,
          )
        }
        // Same back contract as RenameAddressDialog — only surfaces
        // when the dialog was opened from AddressDetail.
        onBack={
          pendingAddressEdit?.returnTo
            ? () => {
                const restore = pendingAddressEdit.returnTo;
                setPendingAddressEdit(null);
                setActive(restore);
              }
            : undefined
        }
      />

      <DeleteAddressDialog
        open={pendingAddressDelete !== null}
        onOpenChange={open => {
          if (!open) setPendingAddressDelete(null);
        }}
        onConfirm={() => {
          if (!pendingAddressDelete) return;
          // Fire-and-forget: the viewmodel handler is async (it
          // commits the wallet snapshot) but the dialog closes on
          // the same tick via `onOpenChange(false)`. Any error in
          // the local commit would surface in the contacts store —
          // the L4 demo doesn't currently surface a retry UI for
          // local writes.
          void onDeleteAddress(contact.name, pendingAddressDelete);
        }}
      />
    </div>
  );
}
