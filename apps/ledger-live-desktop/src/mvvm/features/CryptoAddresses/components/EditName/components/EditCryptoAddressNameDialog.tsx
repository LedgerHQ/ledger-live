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
import { useTranslation } from "react-i18next";
import { normalizeName, MAX_ACCOUNT_NAME_LENGTH } from "@ledgerhq/live-wallet/accountName";
import { Chip } from "./Chip";

type EditCryptoAddressNameDialogProps = {
  children: React.ReactNode;
  onConfirm: (value: string) => void;
  initialValue: string;
  suggestions: string[];
};

export const EditCryptoAddressNameDialog = ({
  children,
  onConfirm,
  initialValue,
  suggestions,
}: EditCryptoAddressNameDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue);
  const clickGuardRef = useRef<AbortController | null>(null);

  const normalizedValue = normalizeName(value);
  const isConfirmDisabled = normalizedValue.length === 0 || normalizedValue === initialValue.trim();

  const close = () => {
    clickGuardRef.current?.abort();
    setOpen(false);
  };

  const handleConfirm = () => {
    onConfirm(normalizedValue);
    close();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setValue(initialValue);
      setOpen(true);
    } else {
      close();
    }
  };

  /** Prevents Radix "ghost click": swallow the resulting click before closing. */
  const handlePointerDownOutside = (e: CustomEvent) => {
    e.preventDefault();
    clickGuardRef.current?.abort();
    const ac = new AbortController();
    clickGuardRef.current = ac;
    globalThis.addEventListener(
      "click",
      ev => {
        ev.stopPropagation();
        ev.preventDefault();
        handleOpenChange(false);
      },
      { capture: true, once: true, signal: ac.signal },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        data-testid="edit-crypto-address-name-dialog-content"
        onPointerDownOutside={handlePointerDownOutside}
      >
        <DialogHeader
          appearance="expanded"
          title={t("cryptoAddresses.editName.title")}
          onClose={close}
        />
        <DialogBody className="flex flex-col gap-16">
          <TextInput
            className="pt-2"
            label={t("cryptoAddresses.editName.input")}
            value={value}
            onChange={e => setValue(e.target.value)}
            maxLength={MAX_ACCOUNT_NAME_LENGTH}
          />
          <div className="flex gap-8">
            {suggestions.map(suggestion => (
              <Chip
                key={suggestion}
                onClick={() => setValue(suggestion)}
                dataTestId={`edit-crypto-address-name-suggestion-${suggestion}`}
              >
                {suggestion}
              </Chip>
            ))}
          </div>
        </DialogBody>
        <DialogFooter className="justify-center">
          <Button
            className="w-full"
            appearance="base"
            size="lg"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            data-testid="edit-crypto-address-name-dialog-cta"
          >
            {t("cryptoAddresses.editName.cta")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
