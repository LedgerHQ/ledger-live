import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";
import type { ContactEntry } from "~/renderer/contacts/types";
import type { CryptoOption } from "~/mvvm/features/Contacts/constants/topCryptos";
import type { DisplayContact } from "../utils/groupContacts";
import { groupAddressesByCrypto } from "../utils/groupAddressesByCrypto";
import { useCryptoMeta } from "../utils/cryptoMeta";
import { getContactPhoto, setContactPhoto, useContactPhotos } from "../utils/contactPhoto";
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
import { SeedMismatchInfoDialog } from "./SeedMismatchInfoDialog";

// Defensive fallback for the `onEditAddressOnDevice` call — never used in
// practice (the dialog only fires `onSubmit` while open, i.e. when
// `pendingAddressEdit` is non-null), but satisfies the full `ContactEntry`
// type without a non-null assertion.
const EMPTY_ENTRY: ContactEntry = {
  addressHex: "",
  chainId: 0,
  scope: "",
  hmacRestHex: "",
  derivationPath: "",
};

/**
 * Condensed sticky header (Figma frame `14397:13884`) — surfaces at the
 * top of the details pane once the full header (avatar + name + count +
 * actions) has scrolled out of view. 48px avatar, name in
 * `heading-5-semi-bold`, count in `body-2` muted, then the same
 * "Add address" pill + `…` contact menu as the full header.
 *
 * Entrance: mounted with `-translate-y-full`, then flipped to
 * `translate-y-0` on the next animation frame so the bar slides down
 * from the top with `ease-out` over 300ms (per spec). The flip must
 * happen AFTER the initial style is committed or the browser would
 * coalesce both states and skip the transition.
 *
 * Exit (reverse): when `visible` flips false the bar slides back up
 * with the same 300ms ease-out, then reports `onExited` so the parent
 * unmounts it once the animation has finished.
 */
function CondensedHeader({
  visible,
  onExited,
  contact,
  countLabel,
  onAddAddress,
  onEditContact,
  onDeleteContact,
  canDelete,
  addAddressLabel,
}: {
  visible: boolean;
  onExited: () => void;
  contact: DisplayContact;
  countLabel: string;
  onAddAddress: () => void;
  onEditContact: () => void;
  onDeleteContact: () => void;
  canDelete: boolean;
  addAddressLabel: string;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (visible) {
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    }
    // Reverse animation: slide back up, then let the parent unmount us
    // once the 300ms transition has played out. If the user scrolls
    // back down mid-exit, `visible` flips true again and the cleanup
    // cancels the pending unmount — the bar just slides back in.
    setShown(false);
    const timer = setTimeout(onExited, 300);
    return () => clearTimeout(timer);
  }, [visible, onExited]);

  return (
    <div
      data-testid="contacts-management-condensed-header"
      className={cn(
        // Pinned over the scroll region; the panel's `overflow-hidden`
        // clips the bar while it sits above the top edge.
        //
        // `z-[30]`: the Lumen Tailwind preset REPLACES the default
        // numeric z-index scale with named tokens (`z-menu`, …), so a
        // plain `z-10` emits no CSS — leaving the bar at `z-index:
        // auto`, where the rows' absolutely-positioned network badges
        // (later in DOM order) painted on top of it. An arbitrary
        // value sits above those (auto) and below `z-dialog-overlay`
        // (90).
        "absolute top-0 inset-x-0 z-[30] flex items-center gap-16 p-16 bg-surface",
        // Figma `box-shadow/lg` lifting the bar off the scrolling rows.
        // Lumen's registered `.shadow-lg` utility IS that token:
        // `0 4px 6px -4px rgba(0,0,0,0.10), 0 10px 15px -3px rgba(0,0,0,0.10)`.
        "shadow-lg",
        "transition-transform duration-300 ease-out",
        shown ? "translate-y-0" : "-translate-y-full",
      )}
    >
      <InitialsAvatar name={contact.name} size="md" colorKey={contact.colorKey} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="heading-5-semi-bold text-base truncate">{contact.name}</p>
        <p className="body-2 text-muted truncate">{countLabel}</p>
      </div>
      <Button
        appearance="gray"
        size="sm"
        icon={Plus}
        onClick={onAddAddress}
        data-testid="contacts-management-add-address-condensed"
      >
        {addAddressLabel}
      </Button>
      <ContactMenu onEdit={onEditContact} onDelete={onDeleteContact} canDelete={canDelete} />
    </div>
  );
}

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
   * Verb factory for the merged on-device "Edit address" flow. Used by
   * `EditAddressDialog` to drive `RunDeviceAction` once the user submits
   * the new address + name; the closure routes to editAddress /
   * editAddressLabel / register based on what changed.
   */
  onEditAddressOnDevice: (
    currentDisplayName: string,
    entry: ContactEntry,
    changes: { newAddressHex: string; newScope: string },
  ) => (deviceId: string) => Promise<unknown>;
};

/**
 * Right pane of the Contacts management page.
 *
 * Layout (header per Figma frame 14391:12543):
 * - Outer container: rounded `bg-surface` panel with vertical stack,
 *   gap 32, padding 16/32.
 * - Header block (centered): large `InitialsAvatar` (72px) + name in
 *   `heading-3-semi-bold` + pluralized address-count in `body-2`
 *   text-muted, then an actions row below it — a gray "Add address"
 *   pill (Plus icon + label) and the `…` ContactMenu.
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
  // Current picture from the cosmetic photo sidecar, keyed by the
  // contact's wallet key (= the FULL display name — for Me that's the
  // suffixed form, unlike the stripped `currentName` the Edit dialog
  // shows). Pre-fills the Edit dialog's picker; saves write back here.
  const photos = useContactPhotos();
  const contactPhoto = getContactPhoto(photos, contact.name);

  // Condensed sticky header (Figma 14397:13884). An IntersectionObserver
  // rooted on the scroll region watches the full header block: once it
  // has fully scrolled out of view, the condensed bar mounts (and slides
  // in from the top — see `CondensedHeader`); when the header comes back,
  // the bar unmounts. Guarded for jsdom, which doesn't implement
  // IntersectionObserver — tests simply never see the condensed bar.
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [condensed, setCondensed] = useState(false);
  // The bar stays MOUNTED while its exit animation plays: `condensed`
  // is the observer's target state, `condensedMounted` lags it on the
  // way out (cleared by the bar's `onExited` once the reverse slide
  // has finished).
  const [condensedMounted, setCondensedMounted] = useState(false);
  useEffect(() => {
    if (condensed) setCondensedMounted(true);
  }, [condensed]);
  const handleCondensedExited = useCallback(() => setCondensedMounted(false), []);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const root = scrollRef.current;
    const target = headerRef.current;
    if (!root || !target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCondensed(!entry.isIntersecting),
      // `threshold: 0` + no margin → flips exactly when the LAST pixel
      // of the header block leaves the scroll viewport.
      { root, threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

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
  // the header's "Add address" button or the empty-state CTA. The
  // dialog itself owns the step machine; we just toggle visibility.
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

  // The single address entry currently in the merged Edit-address dialog
  // (Figma `14330:13645` — edits the address hex AND/OR the per-entry
  // name). Opens from either the per-row overflow menu or the
  // AddressDetail dialog's "Edit" tile.
  //
  // `returnTo` remembers the AddressDetail selection AT THE MOMENT the
  // user clicked Edit from inside it. Set only when the entry point is
  // AddressDetail — used to render the back arrow on the header and to
  // restore the source dialog on click. `null` for opens from the row's
  // overflow menu / right-click (no surface to back into).
  type PendingAddressEdit = {
    entry: ContactEntry;
    returnTo: ActiveSelection | null;
  };
  const [pendingAddressEdit, setPendingAddressEdit] =
    useState<PendingAddressEdit | null>(null);
  const openEditAddress = (entry: ContactEntry) => {
    // Triggered from the row menu — no source dialog to restore.
    setPendingAddressEdit({ entry, returnTo: null });
  };
  const openEditAddressFromDetail = (entry: ContactEntry) => {
    // Triggered from AddressDetail's Edit tile. Snapshot the current
    // `active` selection BEFORE we close it so the back handler can
    // reopen exactly the same detail dialog. We close AddressDetail here
    // too so we don't render two stacked dialogs.
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

  // Seed-mismatch info dialog (device returned SW 0x6982 — the contact was
  // registered under a different seed). Any of the device-backed editing
  // dialogs can trigger it; we close whichever is open and surface this
  // shared dialog. Hosted here (not inside the editing dialogs) so it
  // survives the editing dialog unmounting on close.
  const [seedMismatchOpen, setSeedMismatchOpen] = useState(false);
  const handleSeedMismatch = useCallback(() => {
    setAddAddressOpen(false);
    setEditContactOpen(false);
    setPendingAddressEdit(null);
    setSeedMismatchOpen(true);
  }, []);

  // Other display names — exclude the current contact so the dialog's
  // duplicate check treats "rename to same name" as a no-op rather
  // than a duplicate.
  const otherTakenNames = useMemo(
    () => takenContactNames.filter(n => n !== contact.name),
    [takenContactNames, contact.name],
  );

  return (
    // Outer panel: a NON-scrolling clip box (`relative overflow-hidden
    // min-h-0` — the grid item needs the min-height clamp, and the
    // overflow clip both contains the scroll region and hides the
    // condensed bar while it sits translated above the top edge). The
    // scroll lives on the inner region so the condensed bar can pin
    // over it.
    <div
      data-testid="contacts-management-details"
      className="relative flex flex-col h-full min-h-0 overflow-hidden rounded-lg bg-surface"
    >
      {condensedMounted && (
        <CondensedHeader
          visible={condensed}
          onExited={handleCondensedExited}
          contact={contact}
          countLabel={t("contactsManagement.addresses", { count })}
          onAddAddress={openAddAddress}
          onEditContact={() => setEditContactOpen(true)}
          onDeleteContact={() => setDeleteContactOpen(true)}
          canDelete={!isMe}
          addAddressLabel={t("contactsManagement.addAddressLabel")}
        />
      )}

      <div
        ref={scrollRef}
        className="flex flex-col gap-32 flex-1 min-h-0 overflow-y-auto px-16 py-32"
      >
      {/* Header (Figma 14391:12543) — centered identity block with the
          actions row BELOW it (gap-24): a labeled gray "Add address"
          pill + the `…` contact menu. Replaces the previous absolute
          top-right `+`/`…` icon buttons; the visible label also retires
          the tooltip the bare `+` needed. The ref feeds the
          IntersectionObserver driving the condensed sticky header. */}
      <div ref={headerRef} className="flex flex-col items-center gap-24 w-full">
        <div className="flex flex-col items-center gap-16 w-full">
          <InitialsAvatar name={contact.name} size="lg" colorKey={contact.colorKey} />
          <div className="flex flex-col items-center gap-4 w-full text-center">
            <h2 className="heading-3-semi-bold text-base">{contact.name}</h2>
            <p className="body-2 text-muted">
              {t("contactsManagement.addresses", { count })}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-8">
          <Button
            appearance="gray"
            size="sm"
            icon={Plus}
            onClick={openAddAddress}
            data-testid="contacts-management-add-address"
          >
            {t("contactsManagement.addAddressLabel")}
          </Button>
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
      </div>

      {/* Empty state — surfaced when the selected contact has no
          addresses (a freshly-added sidecar contact, or the synthetic
          "me" placeholder). Figma frame 13922:11258. */}
      {count === 0 && <EmptyAddressState contactName={contact.name} isMe={isMe} />}

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
              // `cryptoId` is `string` on CryptoAddressGroup, so comparing it to
              // "unknown" can't discriminate the union — narrow on the `crypto`
              // field, which only CryptoAddressGroup carries.
              if (!("crypto" in section)) return null;
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
                        onEditAddress={openEditAddress}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
      </div>

      <AddressDetailDialog
        open={active !== null}
        onOpenChange={isOpen => {
          if (!isOpen) setActive(null);
        }}
        contact={contact}
        entry={activeEntry}
        crypto={active?.crypto}
        // The detail dialog is the ONLY surface that should hand the
        // user a "back" arrow on the edit modal — use the *FromDetail
        // helper here so the snapshot of `active` is captured BEFORE we
        // close it.
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
        onSeedMismatch={handleSeedMismatch}
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
        currentPhoto={contactPhoto}
        // Write under `contact.name` (the wallet key), NOT the dialog's
        // possibly-stripped `currentName` — see the Me-suffix note above.
        onPhotoSave={photo => setContactPhoto(contact.name, photo)}
        onSeedMismatch={handleSeedMismatch}
      />

      <DeleteContactDialog
        open={deleteContactOpen}
        onOpenChange={setDeleteContactOpen}
        onConfirm={() => onDeleteContact(contact.name)}
      />

      <EditAddressDialog
        open={pendingAddressEdit !== null}
        onOpenChange={open => {
          if (!open) setPendingAddressEdit(null);
        }}
        currentAddressHex={pendingAddressEdit?.entry.addressHex ?? ""}
        currentLabel={pendingAddressEdit?.entry.scope ?? ""}
        onSubmit={(newAddressHex, newScope) =>
          // We can safely assert the entry here — the dialog only calls
          // `onSubmit` while it's open, and the dialog is only open when
          // `pendingAddressEdit` is non-null. `onEditAddressOnDevice`
          // routes to editAddress / editAddressLabel / register based on
          // what changed.
          onEditAddressOnDevice(
            contact.name,
            pendingAddressEdit?.entry ?? EMPTY_ENTRY,
            { newAddressHex, newScope },
          )
        }
        // Back arrow wires only when the edit was opened from the
        // AddressDetail dialog — `returnTo` carries the selection we
        // closed when transitioning in, and clicking back closes the
        // edit modal and re-opens AddressDetail on the same entry.
        onBack={
          pendingAddressEdit?.returnTo
            ? () => {
                const restore = pendingAddressEdit.returnTo;
                setPendingAddressEdit(null);
                setActive(restore);
              }
            : undefined
        }
        onSeedMismatch={handleSeedMismatch}
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

      <SeedMismatchInfoDialog
        open={seedMismatchOpen}
        onOpenChange={setSeedMismatchOpen}
      />
    </div>
  );
}
