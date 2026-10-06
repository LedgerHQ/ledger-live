import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogBody,
  Button,
  TextInput,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { normalizeName, MAX_ACCOUNT_NAME_LENGTH } from "@domain/entity-account-name";
import { Chip } from "./Chip";
import { isWithinGhostClickGuard } from "./ghostClickGuard";

type EditCryptoAddressNameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: string) => void;
  initialValue: string;
  suggestions: string[];
  isSyncing: boolean;
};

export const EditCryptoAddressNameDialog = ({
  open,
  onOpenChange,
  onConfirm,
  initialValue,
  suggestions,
  isSyncing,
}: EditCryptoAddressNameDialogProps) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const openedAtRef = useRef(0);

  useEffect(() => {
    if (open) {
      openedAtRef.current = Date.now();
    }
  }, [open]);

  const normalizedValue = normalizeName(value);
  const isConfirmDisabled =
    isSyncing || normalizedValue.length === 0 || normalizedValue === initialValue.trim();

  /** Prevents ghost click: the same click that opens the dialog would immediately close it. */
  const handlePointerDownOutside: NonNullable<
    React.ComponentProps<typeof DialogContent>["onPointerDownOutside"]
  > = e => {
    if (isWithinGhostClickGuard(openedAtRef.current)) {
      e.preventDefault();
    }
  };

  const handleConfirm = () => {
    onConfirm(normalizedValue);
    onOpenChange(false);
  };

  const confirmButton = (
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
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="edit-crypto-address-name-dialog-content"
        onPointerDownOutside={handlePointerDownOutside}
      >
        <DialogHeader
          density="expanded"
          title={t("cryptoAddresses.editName.title")}
          onClose={() => onOpenChange(false)}
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
          {isSyncing ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full">{confirmButton}</span>
              </TooltipTrigger>
              <TooltipContent side="top">
                {t("cryptoAddresses.editName.syncingTooltip")}
              </TooltipContent>
            </Tooltip>
          ) : (
            confirmButton
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
