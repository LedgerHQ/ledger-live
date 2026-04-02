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
import { track } from "~/renderer/analytics/segment";
import { CRYPTO_TRACKING_PAGE_NAME } from "../../../constants";

/** How long after opening to ignore outside-click closes (ghost-click guard). */
const GHOST_CLICK_GUARD_MS = 300;

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
  const openedAtRef = useRef(0);

  const normalizedValue = normalizeName(value);
  const isConfirmDisabled = normalizedValue.length === 0 || normalizedValue === initialValue.trim();

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      openedAtRef.current = Date.now();
      setValue(initialValue);
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
    onConfirm(normalizedValue);
    handleOpenChange(false);
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
          onClose={() => handleOpenChange(false)}
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
