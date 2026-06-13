import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  TextInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { Information, LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import { LIMITS } from "~/mvvm/features/Contacts/constants";
import {
  isInvalidAsciiLabel,
  isPrintableAscii,
  isValidAddressHex,
} from "~/mvvm/features/Contacts/validation";
import CharCounter from "~/mvvm/features/Contacts/components/CharCounter";
import RunDeviceAction from "~/mvvm/features/Contacts/components/RunDeviceAction";

type Step =
  | { kind: "form" }
  | {
      kind: "device";
      verb: (deviceId: string) => Promise<unknown>;
    };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The address entry's current 0x hex (pre-fills the Address field). */
  currentAddressHex: string;
  /** The address entry's current per-entry name / `scope` (pre-fills the Address name field). */
  currentLabel: string;
  /**
   * Verb factory for the on-device edit. The dialog passes the (trimmed)
   * new address + new name; the view-model closure inspects what actually
   * changed and routes to the right device flow (editAddress /
   * editAddressLabel / register-then-drop-old). The returned closure is
   * handed to `RunDeviceAction.run`. A device prompt is always mandatory.
   */
  onSubmit: (
    newAddressHex: string,
    newScope: string,
  ) => (deviceId: string) => Promise<unknown>;
  /**
   * Optional back handler. Set ONLY when the dialog was opened from the
   * `AddressDetailDialog` (the QR + actions modal) — Lumen `DialogHeader`
   * renders a back arrow when provided, returning the user to the detail
   * modal. Omitted when reached via the per-row overflow menu / right-click.
   */
  onBack?: () => void;
};

/**
 * Merged "Edit address" dialog (Figma `14330:13645`).
 *
 * One modal that edits the address hex AND/OR the per-entry name in a
 * single flow — replaces the previously-separate "Edit address" and
 * "Rename address" dialogs. Two steps:
 *   1. `form` — Lumen `density="expanded"` header titled "Edit address",
 *      with two floating-label `TextInput`s pre-filled with the entry's
 *      current values:
 *        • Address — `status="success"` + "Valid address" when the value
 *          parses as a 0x40-char hex; `status="error"` when non-empty +
 *          invalid.
 *        • Address name — trailing `Information` tooltip + a `CharCounter`.
 *      The "Apply changes" button is disabled until BOTH values are valid
 *      AND at least one differs from its current value.
 *   2. `device` — `RunDeviceAction` drives the connect-app flow and runs
 *      the closure built by `onSubmit(newAddress, newName)`. Header is
 *      hidden while the runner owns the body (same pattern as the other
 *      device-confirmed flows). On success the dialog closes; on back/error
 *      it returns to the form so the user can retry without retyping.
 */
export function EditAddressDialog({
  open,
  onOpenChange,
  currentAddressHex,
  currentLabel,
  onSubmit,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const [address, setAddress] = useState(currentAddressHex);
  const [name, setName] = useState(currentLabel);
  const [step, setStep] = useState<Step>({ kind: "form" });

  // Re-prime both inputs + reset to the form step on each open. The active
  // entry may change between opens (user dismisses, picks another row,
  // re-opens) and we don't want the device runner lingering from a
  // previous attempt.
  useEffect(() => {
    if (open) {
      setAddress(currentAddressHex);
      setName(currentLabel);
      setStep({ kind: "form" });
    }
  }, [open, currentAddressHex, currentLabel]);

  const trimmedAddress = address.trim();
  const trimmedName = name.trim();

  const addressValid = isValidAddressHex(trimmedAddress);
  const addressInvalid = trimmedAddress.length > 0 && !addressValid;

  const nameTooLongOrNonAscii = isInvalidAsciiLabel(name, LIMITS.addressLabel);
  const nameNonAsciiOnly = name.length > 0 && !isPrintableAscii(name);
  const nameValid = trimmedName.length > 0 && !nameTooLongOrNonAscii;

  // Enable once BOTH fields are valid AND at least one differs from its
  // current value (editing to the same values is a no-op).
  const addressChanged = trimmedAddress !== currentAddressHex.trim();
  const nameChanged = trimmedName !== currentLabel.trim();
  const canSubmit = addressValid && nameValid && (addressChanged || nameChanged);

  const submit = () => {
    if (!canSubmit) return;
    setStep({ kind: "device", verb: onSubmit(trimmedAddress, trimmedName) });
  };

  const handleDeviceDone = (ok: boolean) => {
    if (ok) onOpenChange(false);
    else setStep({ kind: "form" });
  };

  // Hide the header while the runner owns the body — same pattern
  // AddAddressDialog uses.
  const showHeader = step.kind === "form";

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fit">
      <DialogContent>
        {showHeader && (
          <DialogHeader
            density="expanded"
            title={t("contactsManagement.editAddressDialog.title")}
            onClose={() => onOpenChange(false)}
            // Back arrow renders only when `onBack` is wired — i.e. the
            // dialog was opened from AddressDetail's Edit tile. Coming in
            // via the row menu / right-click leaves `onBack` undefined and
            // Lumen hides the affordance.
            onBack={onBack}
          />
        )}
        <DialogBody
          scrollbarWidth="auto"
          className="flex flex-col gap-24 px-24 pt-8 pb-24"
          data-testid="contacts-management-edit-address-dialog"
        >
          {step.kind === "form" && (
            <>
              {/* `gap-16` between the two input groups + button — mirrors
                  the Figma `edit address/field` 16px stack. */}
              <div className="flex flex-col gap-16 w-full">
                <TextInput
                  label={t("contactsManagement.addAddress.addressLabel")}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  status={
                    addressValid ? "success" : addressInvalid ? "error" : undefined
                  }
                  helperText={
                    addressValid
                      ? t("contactsManagement.addAddress.addressValid")
                      : addressInvalid
                        ? t("contactsManagement.addAddress.addressInvalid")
                        : undefined
                  }
                  // Hide Lumen's intrinsic clear button — keeps the field
                  // consistent with the Add-address inputs.
                  hideClearButton
                  data-testid="contacts-management-edit-address-input"
                  autoFocus
                />

                <div className="flex flex-col gap-8 w-full">
                  <TextInput
                    label={t("contactsManagement.addAddress.addressNameLabel")}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submit();
                      }
                    }}
                    aria-invalid={nameTooLongOrNonAscii}
                    status={nameNonAsciiOnly ? "error" : undefined}
                    helperText={
                      nameNonAsciiOnly
                        ? t("contactsManagement.addContactDialog.errorAscii")
                        : undefined
                    }
                    hideClearButton
                    suffix={
                      <Tooltip>
                        {/*
                          Bare `Information` icon as the tooltip trigger —
                          matches the Add-address name field (Figma
                          `14198:8264`): a plain 20×20 glyph with no
                          hover/pressed chrome, default arrow cursor.
                        */}
                        <TooltipTrigger asChild>
                          <Information
                            size={20}
                            role="img"
                            tabIndex={0}
                            aria-label={t("contactsManagement.addAddress.nameTooltipAriaLabel")}
                            className="text-muted cursor-default focus:outline-none"
                            data-testid="contacts-management-edit-address-name-info"
                          />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-280 whitespace-pre-line text-center"
                        >
                          {t("contactsManagement.addAddress.nameTooltip")}
                        </TooltipContent>
                      </Tooltip>
                    }
                    data-testid="contacts-management-edit-address-name"
                  />
                  <CharCounter used={name.length} limit={LIMITS.addressLabel} />
                </div>
              </div>

              <Button
                appearance="base"
                size="md"
                isFull
                icon={LedgerLogo}
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
