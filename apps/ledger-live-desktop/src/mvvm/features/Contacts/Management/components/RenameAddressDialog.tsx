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

type Step =
  | { kind: "name" }
  | {
      kind: "device";
      newLabel: string;
      verb: (deviceId: string) => Promise<unknown>;
    };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The address entry's current per-entry label (`entry.scope`). */
  currentLabel: string;
  /**
   * Verb factory for the on-device rename. Returns the closure handed
   * to `RunDeviceAction.run`. The DMK `editAddressLabel` command
   * re-HMACs the entry against the new scope, so a device prompt is
   * mandatory for canonical addresses — there's no local-only
   * shortcut that keeps the on-device record consistent.
   */
  onDeviceRename: (newLabel: string) => (deviceId: string) => Promise<unknown>;
  /**
   * Optional back handler. Set ONLY when the dialog was opened from
   * the `AddressDetailDialog` (the QR + actions modal) — Lumen
   * `DialogHeader` renders a back arrow on the left of the header
   * when this is provided, and clicking it returns the user to the
   * detail modal. Omitted when the dialog is reached directly from
   * the per-row overflow menu / right-click, so there's no surface
   * to navigate "back" to.
   */
  onBack?: () => void;
};

/**
 * "Rename address" dialog — Figma frames `14182:12897` (initial state,
 * submit disabled) and `14151:11140` (after edit, submit enabled).
 *
 * Two-step dialog mirroring `EditContactDialog`'s device path:
 *   1. `name` — Lumen `density="expanded"` header, floating-label
 *      `TextInput` pre-filled with the address's current scope, char
 *      counter, full-width "Change address name" button. Submit is
 *      disabled until the value is 1..32 ASCII characters AND has
 *      actually changed from `currentLabel`.
 *   2. `device` — `RunDeviceAction` drives the canonical Eth-app
 *      connect flow and runs `onDeviceRename(newLabel)` against the
 *      device. Header is hidden (same pattern as AddAddressDialog).
 *
 * On the runner's success the dialog closes; on back/error it
 * returns to the name step so the user can retry without retyping.
 */
export function RenameAddressDialog({
  open,
  onOpenChange,
  currentLabel,
  onDeviceRename,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState(currentLabel);
  const [step, setStep] = useState<Step>({ kind: "name" });

  // Re-prime input + reset to the name step every time the dialog
  // opens — the active address entry may change between opens (user
  // dismisses, picks another row, re-opens) and we don't want the
  // device runner lingering from a previous attempt.
  useEffect(() => {
    if (open) {
      setValue(currentLabel);
      setStep({ kind: "name" });
    }
  }, [open, currentLabel]);

  const trimmed = value.trim();
  const tooLongOrNonAscii = isInvalidAsciiLabel(value, LIMITS.addressLabel);
  const nonAsciiOnly = value.length > 0 && !isPrintableAscii(value);
  const sameAsCurrent = trimmed === currentLabel.trim();
  const canSubmit = trimmed.length > 0 && !tooLongOrNonAscii && !sameAsCurrent;

  const submit = () => {
    if (!canSubmit) return;
    setStep({ kind: "device", newLabel: trimmed, verb: onDeviceRename(trimmed) });
  };

  const handleDeviceDone = (ok: boolean) => {
    if (ok) onOpenChange(false);
    else setStep({ kind: "name" });
  };

  // Header hides while the runner owns the body — same pattern
  // AddAddressDialog uses (no back arrow / close while signing).
  const showHeader = step.kind === "name";

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fit">
      <DialogContent>
        {showHeader && (
          <DialogHeader
            density="expanded"
            title={t("contactsManagement.renameAddressDialog.title")}
            onClose={() => onOpenChange(false)}
            // Render the back arrow ONLY when an `onBack` handler is
            // wired (i.e. the dialog was opened from AddressDetail's
            // Rename tile). When the user came in via the row's
            // kebab/right-click menu `onBack` is undefined and Lumen
            // hides the affordance.
            onBack={onBack}
          />
        )}
        <DialogBody
          scrollbarWidth="auto"
          className="flex flex-col gap-24 px-24 pt-8 pb-24"
          data-testid="contacts-management-rename-address-dialog"
        >
          {step.kind === "name" && (
            <>
              <div className="flex flex-col gap-8 w-full">
                <TextInput
                  label={t("contactsManagement.renameAddressDialog.placeholder")}
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  aria-invalid={tooLongOrNonAscii}
                  errorMessage={
                    nonAsciiOnly
                      ? t("contactsManagement.addContactDialog.errorAscii")
                      : undefined
                  }
                  data-testid="contacts-management-rename-address-input"
                  autoFocus
                />
                <CharCounter used={value.length} limit={LIMITS.addressLabel} />
              </div>

              <Button
                appearance="base"
                size="md"
                isFull
                onClick={submit}
                disabled={!canSubmit}
                data-testid="contacts-management-rename-address-submit"
              >
                {t("contactsManagement.renameAddressDialog.submit")}
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
