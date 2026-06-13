import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
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
import RunDeviceAction from "~/mvvm/features/Contacts/components/RunDeviceAction";
import { ContactPhotoField } from "./ContactPhotoField";

type Step =
  | { kind: "name" }
  | {
      kind: "device";
      newName: string;
      verb: (deviceId: string) => Promise<unknown>;
    };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current display name. Pre-fills the input on open. */
  currentName: string;
  /**
   * Submit handler for the local-only path (contact has no on-device
   * entry yet). Parent updates the rename overlay + selection.
   */
  onSubmit: (newName: string) => void;
  /**
   * Names that should be rejected as duplicates. Should include every
   * display name visible in the merged view EXCEPT the current name
   * (renaming to the same name is a no-op, not a duplicate).
   */
  takenNames: string[];
  /**
   * True when the rename must run on device (≥1 address registered on
   * device under this contact). The dialog switches to a device-runner
   * step after submit and calls `onDeviceRename(newName)` to build the
   * DMK verb. When false (default), `onSubmit` is called instead.
   */
  requiresDeviceConfirm?: boolean;
  /**
   * Verb factory for the device path. Returns the closure handed to
   * `RunDeviceAction.run`. Only consulted when `requiresDeviceConfirm`
   * is true.
   */
  onDeviceRename?: (newName: string) => (deviceId: string) => Promise<unknown>;
  /**
   * The contact's current picture (data URL from the `contactPhoto`
   * sidecar), pre-filling the picker on open. `undefined` = none.
   */
  currentPhoto?: string;
  /**
   * Commits a staged picture change (new data URL, or `undefined` to
   * delete). Called at submit time, BEFORE any rename — the parent
   * writes the sidecar under the contact's real wallet key (which may
   * differ from `currentName`, e.g. the stripped Me name), and the
   * rename paths re-key the photo afterwards. Photo changes are local
   * cosmetics, so they apply even if a device rename is then cancelled.
   */
  onPhotoSave?: (photo: string | undefined) => void;
};

/**
 * "Edit contact" Dialog (Figma frame 13981:10017).
 *
 * Layout identical to `AddContactDialog` — same Lumen Dialog shell,
 * `density="expanded"` header, the shared `ContactPhotoField` picture
 * picker (add / replace / delete, same rules as Add-contact),
 * autofocused `TextInput` pre-filled with the contact's current name,
 * char counter, full-width submit Button.
 *
 * Submit button copy is `Save changes` rather than the Figma's
 * "Add contact" label — the Figma copy is a clear paste-over from the
 * Add Contact frame and would misread on a rename action. Wrapped in
 * its own i18n key (`editContactDialog.submit`) so we can tune later.
 *
 * Validation rules mirror AddContactDialog:
 *   - 1..32 ASCII characters.
 *   - Not a duplicate of any other visible contact name (case-insensitive).
 * Plus: submit is disabled when NOTHING changed — i.e. the trimmed
 * input equals the current name AND the staged picture matches
 * `currentPhoto`. A photo-only edit keeps the same name and is a valid
 * save.
 *
 * Submit paths:
 *   - Photo change (if any) commits first via `onPhotoSave` — it's a
 *     local cosmetic write, no device involved.
 *   - Name unchanged → close. Done (photo-only save).
 *   - Name changed, `requiresDeviceConfirm` false → call
 *     `onSubmit(newName)` and close. The parent applies the local
 *     rename overlay. Used for sidecar-only contacts and the
 *     synthesized "me" placeholder — neither has an on-device label.
 *   - Name changed, `requiresDeviceConfirm` true → switch to the device
 *     step. `RunDeviceAction` runs the `onDeviceRename(newName)` verb
 *     against the user's hardware (DMK change-name flow). On success
 *     the dialog closes; on failure/back, the dialog returns to the
 *     name step so the user can edit and retry.
 */
export function EditContactDialog({
  open,
  onOpenChange,
  currentName,
  onSubmit,
  takenNames,
  requiresDeviceConfirm = false,
  onDeviceRename,
  currentPhoto,
  onPhotoSave,
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(currentName);
  // Staged picture — committed via `onPhotoSave` only on submit, so
  // closing the dialog discards in-flight photo edits.
  const [photo, setPhoto] = useState<string | undefined>(currentPhoto);
  const [step, setStep] = useState<Step>({ kind: "name" });

  // Re-prime the inputs each time the dialog opens, in case the
  // currentName/currentPhoto changed since the previous open (e.g. user
  // opened → closed → selected another contact → opened). Reset step
  // too so the device runner doesn't linger after a back/close.
  useEffect(() => {
    if (open) {
      setName(currentName);
      setPhoto(currentPhoto);
      setStep({ kind: "name" });
    }
  }, [open, currentName, currentPhoto]);

  const trimmed = name.trim();
  const tooLongOrNonAscii = isInvalidAsciiLabel(name, LIMITS.contactName);
  const nonAsciiOnly = name.length > 0 && !isPrintableAscii(name);
  const lowerTrimmed = trimmed.toLowerCase();
  const duplicate =
    trimmed.length > 0 &&
    takenNames.some(taken => taken.toLowerCase() === lowerTrimmed);
  const sameAsCurrent = trimmed.toLowerCase() === currentName.trim().toLowerCase();
  const photoChanged = photo !== currentPhoto;
  // A photo-only edit (same name, different picture) is a valid save —
  // the name checks still gate, but `sameAsCurrent` alone no longer
  // disables submit when the picture changed.
  const canSubmit =
    trimmed.length > 0 &&
    !tooLongOrNonAscii &&
    !duplicate &&
    (!sameAsCurrent || photoChanged);

  const submit = () => {
    if (!canSubmit) return;
    // Commit the picture first — a local cosmetic write, independent of
    // the rename. The view model's rename paths re-key the sidecar, so
    // writing under the current name here stays correct even when a
    // rename follows.
    if (photoChanged) onPhotoSave?.(photo);
    if (sameAsCurrent) {
      // Photo-only save — nothing to rename, no device round-trip.
      onOpenChange(false);
      return;
    }
    if (requiresDeviceConfirm && onDeviceRename) {
      setStep({ kind: "device", newName: trimmed, verb: onDeviceRename(trimmed) });
    } else {
      onSubmit(trimmed);
    }
  };

  const handleDeviceDone = (ok: boolean) => {
    if (ok) onOpenChange(false);
    else setStep({ kind: "name" });
  };

  // Hide the header while the runner owns the body — mirrors the
  // AddAddressDialog pattern (no back arrow / close while signing).
  const showHeader = step.kind === "name";

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fit">
      <DialogContent>
        {showHeader && (
          <DialogHeader
            density="expanded"
            title={t("contactsManagement.editContactDialog.title")}
            onClose={() => onOpenChange(false)}
          />
        )}
        <DialogBody
          scrollbarWidth="auto"
          // Same `pt-8` as AddContactDialog — gives the focused input's
          // outline clearance from the header's bottom edge.
          className="flex flex-col gap-24 px-24 pt-8 pb-24"
          data-testid="contacts-management-edit-contact-dialog"
        >
          {step.kind === "name" && (
            <>
              {/*
                Same picture picker as the Add-contact dialog (Figma
                14369:13296) — add, replace, or delete the contact's
                photo. `key={open}` remounts the field per open so its
                internal rejection error resets with the staged state.
              */}
              <ContactPhotoField key={String(open)} photo={photo} onPhotoChange={setPhoto} />

              <div className="flex flex-col gap-8 w-full">
                <TextInput
                  label={t("contactsManagement.editContactDialog.placeholder")}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  aria-invalid={tooLongOrNonAscii || duplicate}
                  status={duplicate || nonAsciiOnly ? "error" : undefined}
                  helperText={
                    duplicate
                      ? t("contactsManagement.addContactDialog.errorDuplicate")
                      : nonAsciiOnly
                        ? t("contactsManagement.addContactDialog.errorAscii")
                        : undefined
                  }
                  data-testid="contacts-management-edit-contact-name"
                  autoFocus
                />
                <CharCounter used={name.length} limit={LIMITS.contactName} />
              </div>

              <Button
                appearance="base"
                size="md"
                isFull
                onClick={submit}
                disabled={!canSubmit}
                data-testid="contacts-management-edit-contact-submit"
              >
                {t("contactsManagement.editContactDialog.submit")}
              </Button>
            </>
          )}

          {step.kind === "device" && (
            <RunDeviceAction run={step.verb} onDone={handleDeviceDone} />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
