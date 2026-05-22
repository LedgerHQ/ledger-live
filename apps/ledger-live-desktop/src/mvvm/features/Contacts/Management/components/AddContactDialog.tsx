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
  /**
   * Called when the user confirms a valid name. The parent is responsible
   * for the actual contact creation + selection — the dialog only knows
   * about the input.
   */
  onSubmit: (name: string) => void;
  /**
   * Names that should be rejected as duplicates. Includes canonical
   * `useContacts().wallet.contacts` keys plus any sidecar names. Matched
   * case-insensitively.
   */
  takenNames: string[];
};

/**
 * "Add contact" dialog (Figma frames 13932:5015 / 13932:7803).
 *
 * Single text input + char counter + submit button. Validation rules:
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

  // Reset the input whenever the dialog transitions from closed → open
  // so each open starts with a blank field.
  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const trimmed = name.trim();
  const tooLongOrNonAscii = isInvalidAsciiLabel(name, LIMITS.contactName);
  const nonAsciiOnly = name.length > 0 && !isPrintableAscii(name);
  const duplicate =
    trimmed.length > 0 &&
    takenNames.some(taken => taken.toLowerCase() === trimmed.toLowerCase());
  const canSubmit = trimmed.length > 0 && !tooLongOrNonAscii && !duplicate;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fit">
      <DialogContent>
        <DialogHeader
          title={t("contactsManagement.addContactDialog.title")}
          onClose={() => onOpenChange(false)}
        />
        <DialogBody
          scrollbarWidth="auto"
          className="flex flex-col gap-24 px-24 pb-24"
          data-testid="contacts-management-add-contact-dialog"
        >
          <div className="flex flex-col gap-4 w-full">
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
              aria-invalid={tooLongOrNonAscii || duplicate}
              errorMessage={
                duplicate
                  ? t("contactsManagement.addContactDialog.errorDuplicate")
                  : nonAsciiOnly
                    ? t("contactsManagement.addContactDialog.errorAscii")
                    : undefined
              }
              data-testid="contacts-management-add-contact-name"
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
            data-testid="contacts-management-add-contact-submit"
          >
            {t("contactsManagement.addContactDialog.submit")}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
