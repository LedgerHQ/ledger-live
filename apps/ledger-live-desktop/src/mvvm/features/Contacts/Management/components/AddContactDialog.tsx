import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Banner,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { LIMITS } from "~/mvvm/features/Contacts/constants";
import {
  isInvalidAsciiLabel,
  isPrintableAscii,
} from "~/mvvm/features/Contacts/validation";
import CharCounter from "~/mvvm/features/Contacts/components/CharCounter";
import { ME_DISPLAY_SUFFIX } from "../utils/groupContacts";
import { ContactPhotoField } from "./ContactPhotoField";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called when the user confirms a valid name. The parent is responsible
   * for the actual contact creation + selection — the dialog only knows
   * about the input. `photoDataUrl` carries the (optional) picture the
   * user uploaded, already validated (JPG/JPEG/PNG, ≤2MB) and encoded
   * as a `data:` URL; `undefined` when none was selected.
   */
  onSubmit: (name: string, photoDataUrl?: string) => void;
  /**
   * Names that should be rejected as duplicates. Includes canonical
   * `useContacts().wallet.contacts` keys plus any sidecar names. Matched
   * case-insensitively.
   */
  takenNames: string[];
};

/**
 * "Add contact" dialog (Figma frames 13932:5015 / 13932:7803, picture
 * row added in 14369:13296).
 *
 * Optional picture upload (`ContactPhotoField` — shared with the
 * Edit-contact dialog) + single text input + char counter + submit
 * button.
 *
 * The picture is optional — it never gates `canSubmit`. Name rules:
 *   - 1..32 characters (`LIMITS.contactName`).
 *   - Printable ASCII only (mirrors the L1 form's
 *     `isInvalidAsciiLabel`).
 *   - Not already used by a canonical or sidecar contact
 *     (case-insensitive — the device's HMAC keys would collide on a
 *     duplicate name regardless of case).
 *
 * Submit button is disabled until the input passes all three checks.
 * Hitting Enter inside the input also fires the submit handler so the
 * keyboard flow matches the click flow.
 *
 * Local state resets every time the dialog re-opens so the field is
 * blank for the next add.
 */
export function AddContactDialog({ open, onOpenChange, onSubmit, takenNames }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  // The accepted upload as a data URL (`undefined` = no picture).
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  // Reset the inputs whenever the dialog transitions from closed → open
  // so each open starts blank. (The photo field's internal error state
  // resets through its `key` below.)
  useEffect(() => {
    if (open) {
      setName("");
      setPhoto(undefined);
    }
  }, [open]);

  const trimmed = name.trim();
  const tooLongOrNonAscii = isInvalidAsciiLabel(name, LIMITS.contactName);
  const nonAsciiOnly = name.length > 0 && !isPrintableAscii(name);
  const duplicate =
    trimmed.length > 0 &&
    takenNames.some(taken => taken.toLowerCase() === trimmed.toLowerCase());
  // ` (Me)` is reserved for the protected Me identity — any other
  // contact ending with that suffix would collide with `isMeIdentity`
  // (the post-promotion Me detector) and get pinned at the top of the
  // list / become undeletable. Block it here at the source.
  const meSuffixCollision = trimmed.endsWith(ME_DISPLAY_SUFFIX);
  const canSubmit =
    trimmed.length > 0 && !tooLongOrNonAscii && !duplicate && !meSuffixCollision;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(trimmed, photo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fit">
      <DialogContent>
        {/* `density="expanded"` matches the Figma 13932:5068 layout:
            close button (X) anchored top-right, title `Add contact` in
            `heading-3-semi-bold` left-aligned beneath it. The default
            `compact` density puts both in a single row. */}
        <DialogHeader
          density="expanded"
          title={t("contactsManagement.addContactDialog.title")}
          onClose={() => onOpenChange(false)}
        />
        <DialogBody
          scrollbarWidth="auto"
          // `pt-8` so the focused input's purple ring has clearance from
          // the bottom of the expanded header — Lumen's DialogHeader
          // expanded variant ends with `pb-12` and the body has no
          // intrinsic top padding, so without this the ring sits flush
          // against the header text and the top edge of the ring reads
          // as clipped.
          className="flex flex-col gap-24 px-24 pt-8 pb-24"
          data-testid="contacts-management-add-contact-dialog"
        >
          {/*
            Picture upload row (Figma 14369:13296). The picture is
            optional — the row never blocks submission. `key={open}`
            remounts the field on each open/close transition so its
            internal rejection error resets alongside the photo state.
          */}
          <ContactPhotoField key={String(open)} photo={photo} onPhotoChange={setPhoto} />

          {/* `gap-8` per the Figma spec — 8px between the input and the
              char counter. */}
          <div className="flex flex-col gap-8 w-full">
            <TextInput
              placeholder={t("contactsManagement.addContactDialog.placeholder")}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              aria-invalid={tooLongOrNonAscii || duplicate || meSuffixCollision}
              errorMessage={
                duplicate
                  ? t("contactsManagement.addContactDialog.errorDuplicate")
                  : meSuffixCollision
                    ? t("contactsManagement.addContactDialog.errorMeSuffix")
                    : nonAsciiOnly
                      ? t("contactsManagement.addContactDialog.errorAscii")
                      : undefined
              }
              data-testid="contacts-management-add-contact-name"
              autoFocus
            />
            <CharCounter used={name.length} limit={LIMITS.contactName} />
          </div>

          {/*
            Privacy guidance banner (Figma frame `14201:12756`).
            Sits between the input group and the submit button, with the
            DialogBody's `gap-24` providing the 24px breathing room on
            both sides. `appearance="info"` (Lumen default) renders the
            grey card with the info `i` glyph on the left exactly like
            the Figma — no title, copy in `description` so the icon
            anchors to the top of the multi-line text.
          */}
          <Banner
            appearance="info"
            description={t("contactsManagement.addContactDialog.privacyBanner")}
            data-testid="contacts-management-add-contact-privacy-banner"
          />

          <Button
            appearance="base"
            size="md"
            isFull
            onClick={submit}
            disabled={!canSubmit}
            data-testid="contacts-management-add-contact-submit"
          >
            {t("contactsManagement.addContactDialog.submit")}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
