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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current display name. Pre-fills the input on open. */
  currentName: string;
  /**
   * Called when the user submits a valid new name. Parent handles the
   * actual rename (sidecar override + selection update).
   */
  onSubmit: (newName: string) => void;
  /**
   * Names that should be rejected as duplicates. Should include every
   * display name visible in the merged view EXCEPT the current name
   * (renaming to the same name is a no-op, not a duplicate).
   */
  takenNames: string[];
};

/**
 * "Edit contact" Dialog (Figma frame 13981:10017).
 *
 * Layout identical to `AddContactDialog` — same Lumen Dialog shell,
 * `density="expanded"` header, autofocused `TextInput` pre-filled with
 * the contact's current name, char counter, full-width submit Button.
 *
 * Submit button copy is `Save changes` rather than the Figma's
 * "Add contact" label — the Figma copy is a clear paste-over from the
 * Add Contact frame and would misread on a rename action. Wrapped in
 * its own i18n key (`editContactDialog.submit`) so we can tune later.
 *
 * Validation rules mirror AddContactDialog:
 *   - 1..32 ASCII characters.
 *   - Not a duplicate of any other visible contact name (case-insensitive).
 * Plus: submit is also disabled if the trimmed input equals the current
 * name (no-op rename — caller already handles this defensively).
 */
export function EditContactDialog({
  open,
  onOpenChange,
  currentName,
  onSubmit,
  takenNames,
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(currentName);

  // Re-prime the input each time the dialog opens, in case the
  // currentName changed since the previous open (e.g. user opened →
  // closed → selected another contact → opened).
  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  const trimmed = name.trim();
  const tooLongOrNonAscii = isInvalidAsciiLabel(name, LIMITS.contactName);
  const nonAsciiOnly = name.length > 0 && !isPrintableAscii(name);
  const lowerTrimmed = trimmed.toLowerCase();
  const duplicate =
    trimmed.length > 0 &&
    takenNames.some(taken => taken.toLowerCase() === lowerTrimmed);
  const sameAsCurrent = trimmed.toLowerCase() === currentName.trim().toLowerCase();
  const canSubmit = trimmed.length > 0 && !tooLongOrNonAscii && !duplicate && !sameAsCurrent;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fit">
      <DialogContent>
        <DialogHeader
          density="expanded"
          title={t("contactsManagement.editContactDialog.title")}
          onClose={() => onOpenChange(false)}
        />
        <DialogBody
          scrollbarWidth="auto"
          // Same `pt-8` as AddContactDialog — gives the focused input's
          // outline clearance from the header's bottom edge.
          className="flex flex-col gap-24 px-24 pt-8 pb-24"
          data-testid="contacts-management-edit-contact-dialog"
        >
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
              errorMessage={
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
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
