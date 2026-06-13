import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogBody,
  Button,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { normalizeName, MAX_ACCOUNT_NAME_LENGTH } from "@ledgerhq/live-wallet/accountName";
import RunDeviceAction from "~/mvvm/features/Contacts/components/RunDeviceAction";
import { track } from "~/renderer/analytics/segment";
import { CRYPTO_TRACKING_PAGE_NAME } from "../../../constants";

/** How long after opening to ignore outside-click closes (ghost-click guard). */
const GHOST_CLICK_GUARD_MS = 300;

type Step =
  | { kind: "form" }
  | {
      kind: "device";
      /** The (normalized) name to commit locally once the device approves. */
      name: string;
      verb: (deviceId: string) => Promise<unknown>;
    };

type EditCryptoAddressNameDialogProps = {
  children: React.ReactNode;
  /** Local rename — applied once the device flow has succeeded. */
  onConfirm: (value: string) => void;
  initialValue: string;
  /**
   * Device verb factory (see `useEditNameViewModel.makeDeviceVerb`).
   * When it returns `null` for the typed name (token rows / non-EVM
   * accounts), the dialog falls back to the local-only rename.
   */
  makeDeviceVerb: (newName: string) => ((deviceId: string) => Promise<unknown>) | null;
};

export const EditCryptoAddressNameDialog = ({
  children,
  onConfirm,
  initialValue,
  makeDeviceVerb,
}: EditCryptoAddressNameDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [step, setStep] = useState<Step>({ kind: "form" });
  const openedAtRef = useRef(0);

  const normalizedValue = normalizeName(value);
  const isConfirmDisabled = normalizedValue.length === 0 || normalizedValue === initialValue.trim();
  // Whether confirming will re-register the account on device (EVM main
  // account w/ derivation path) vs. a local-only rename (token / non-EVM).
  // Device-eligibility is name-independent, so a `null` verb here means the
  // CTA stays logo-free — mirrors the send flow's device-action button.
  const requiresDevice = makeDeviceVerb(normalizedValue) !== null;

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      openedAtRef.current = Date.now();
      setValue(initialValue);
      setStep({ kind: "form" });
      track("button_clicked", { button: "edit_account_name", page: CRYPTO_TRACKING_PAGE_NAME });
    }
    setOpen(newOpen);
  };

  /** Prevents ghost click: the same click that opens the dialog would immediately close it. */
  const handlePointerDownOutside: NonNullable<
    React.ComponentProps<typeof DialogContent>["onPointerDownOutside"]
  > = e => {
    if (Date.now() - openedAtRef.current < GHOST_CLICK_GUARD_MS) {
      e.preventDefault();
    }
  };

  const handleConfirm = () => {
    // Renaming a Ledger account re-registers it on the device under the
    // new name (DMK registerLedgerAccount) — the local rename only
    // commits once the user approves on the device. Accounts the DMK
    // verb can't address (token rows, non-EVM) keep the legacy
    // local-only path.
    const verb = makeDeviceVerb(normalizedValue);
    if (!verb) {
      onConfirm(normalizedValue);
      handleOpenChange(false);
      return;
    }
    setStep({ kind: "device", name: normalizedValue, verb });
  };

  const handleDeviceDone = (ok: boolean) => {
    if (ok && step.kind === "device") {
      onConfirm(step.name);
      handleOpenChange(false);
    } else {
      // Back / error → return to the form so the user can retry
      // without retyping.
      setStep({ kind: "form" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        data-testid="edit-crypto-address-name-dialog-content"
        onPointerDownOutside={handlePointerDownOutside}
      >
        {/* Header hides while the device runner owns the body — same
            pattern as the Contacts device-confirmed dialogs. */}
        {step.kind === "form" && (
          <DialogHeader
            density="expanded"
            title={t("cryptoAddresses.editName.title")}
            onClose={() => handleOpenChange(false)}
          />
        )}
        <DialogBody className="flex flex-col gap-16">
          {step.kind === "form" && (
            <TextInput
              className="pt-2"
              label={t("cryptoAddresses.editName.input")}
              value={value}
              onChange={e => setValue(e.target.value)}
              maxLength={MAX_ACCOUNT_NAME_LENGTH}
            />
          )}
          {step.kind === "device" && (
            <RunDeviceAction run={step.verb} onDone={handleDeviceDone} />
          )}
        </DialogBody>
        {step.kind === "form" && (
          <DialogFooter className="justify-center">
            <Button
              className="w-full"
              appearance="base"
              size="lg"
              icon={requiresDevice ? LedgerLogo : undefined}
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              data-testid="edit-crypto-address-name-dialog-cta"
            >
              {t("cryptoAddresses.editName.cta")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
