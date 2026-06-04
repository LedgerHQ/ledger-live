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
import { isValidAddressHex } from "~/mvvm/features/Contacts/validation";
import RunDeviceAction from "~/mvvm/features/Contacts/components/RunDeviceAction";

type Step =
  | { kind: "address" }
  | {
      kind: "device";
      newAddressHex: string;
      verb: (deviceId: string) => Promise<unknown>;
    };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The address entry's current 0x hex. */
  currentAddressHex: string;
  /**
   * Verb factory for the on-device address edit. Returns the closure
   * handed to `RunDeviceAction.run`. The DMK `editExternalAddress`
   * command re-HMACs the entry against the new address, so a device
   * prompt is mandatory — there's no local-only shortcut that keeps
   * the on-device record consistent.
   */
  onDeviceEdit: (newAddressHex: string) => (deviceId: string) => Promise<unknown>;
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
 * "Edit address" dialog — Figma frames `14187:12344` (initial state,
 * submit disabled) and `14074:12293` (after a valid edit, submit
 * enabled).
 *
 * Two-step dialog mirroring `RenameAddressDialog`'s shape:
 *   1. `address` — Lumen `density="expanded"` header, floating-label
 *      `TextInput` pre-filled with the entry's current `addressHex`.
 *      `status="success"` flips the input border green and surfaces
 *      the "✓ Valid address" helperText when the value is a valid
 *      0x40-char hex. The submit is disabled until the value:
 *        • parses as a valid EVM address
 *        • differs from the current address
 *   2. `device` — `RunDeviceAction` drives the connect-app flow and
 *      runs `onDeviceEdit(newAddressHex)` against the device. Header
 *      is hidden (same pattern as the other device-confirmed flows).
 */
export function EditAddressDialog({
  open,
  onOpenChange,
  currentAddressHex,
  onDeviceEdit,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState(currentAddressHex);
  const [step, setStep] = useState<Step>({ kind: "address" });

  // Re-prime + reset to the address step on each open. The active
  // entry may change between opens (user dismisses, picks another
  // row, re-opens) and we don't want the device runner lingering
  // from a previous attempt.
  useEffect(() => {
    if (open) {
      setValue(currentAddressHex);
      setStep({ kind: "address" });
    }
  }, [open, currentAddressHex]);

  const trimmed = value.trim();
  const valid = isValidAddressHex(trimmed);
  const sameAsCurrent = trimmed === currentAddressHex.trim();
  const canSubmit = valid && !sameAsCurrent;

  const submit = () => {
    if (!canSubmit) return;
    setStep({
      kind: "device",
      newAddressHex: trimmed,
      verb: onDeviceEdit(trimmed),
    });
  };

  const handleDeviceDone = (ok: boolean) => {
    if (ok) onOpenChange(false);
    else setStep({ kind: "address" });
  };

  // Hide the header while the runner owns the body — same pattern
  // RenameAddressDialog / AddAddressDialog use.
  const showHeader = step.kind === "address";

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fit">
      <DialogContent>
        {showHeader && (
          <DialogHeader
            density="expanded"
            title={t("contactsManagement.editAddressDialog.title")}
            onClose={() => onOpenChange(false)}
            // Back arrow renders only when `onBack` is wired — i.e. the
            // dialog was opened from AddressDetail's Edit tile. Coming
            // in via the row menu / right-click leaves `onBack`
            // undefined and Lumen hides the affordance.
            onBack={onBack}
          />
        )}
        <DialogBody
          scrollbarWidth="auto"
          className="flex flex-col gap-24 px-24 pt-8 pb-24"
          data-testid="contacts-management-edit-address-dialog"
        >
          {step.kind === "address" && (
            <>
              <TextInput
                label={t("contactsManagement.editAddressDialog.placeholder")}
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                // Mirror AddAddressDialog's AddressStep — green check
                // + "Valid address" helper when the value parses, red
                // hint when non-empty + invalid.
                status={
                  valid
                    ? "success"
                    : trimmed.length > 0 && !valid
                      ? "error"
                      : undefined
                }
                helperText={
                  valid
                    ? t("contactsManagement.addAddress.addressValid")
                    : trimmed.length > 0 && !valid
                      ? t("contactsManagement.addAddress.addressInvalid")
                      : undefined
                }
                data-testid="contacts-management-edit-address-input"
                autoFocus
              />

              <Button
                appearance="base"
                size="md"
                isFull
                onClick={submit}
                disabled={!canSubmit}
                data-testid="contacts-management-edit-address-submit"
              >
                {t("contactsManagement.editAddressDialog.submit")}
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
