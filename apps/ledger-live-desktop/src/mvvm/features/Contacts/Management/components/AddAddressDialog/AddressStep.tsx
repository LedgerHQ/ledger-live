import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  IconButton,
  TextInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import { LIMITS } from "~/mvvm/features/Contacts/constants";
import {
  isInvalidAsciiLabel,
  isValidAddressHex,
} from "~/mvvm/features/Contacts/validation";
import CharCounter from "~/mvvm/features/Contacts/components/CharCounter";

export type AddressStepSubmit = {
  addressHex: string;
  addressName: string;
};

type Props = {
  onSubmit: (payload: AddressStepSubmit) => void;
};

/**
 * Step 3 of the Add-Address flow (Figma frames 13936:20087 /
 * 13957:8439 / 13957:8939).
 *
 * Two inputs + a confirm button. Layout choices baked in:
 * - Lumen `TextInput` floating-label pattern (`label="Address"`,
 *   `label="Address name"`) — matches the Figma's small grey label
 *   above the value.
 * - When the address is non-empty AND parses as a valid 0x40-char
 *   hex, `status="success"` flips the input border green and
 *   surfaces the "✓ Valid address" helperText (Figma 13957:8439).
 * - When the address is non-empty AND invalid, `status="error"` +
 *   inline hint.
 * - The name field has a `suffix` info `IconButton` wrapped in a
 *   Lumen `Tooltip` — hovering surfaces the L4 copy explaining the
 *   name is private/local.
 * - `Register address` Button is disabled until BOTH inputs pass
 *   their validators (matches the disabled/enabled comparison in
 *   13957:8439 → 13957:8939).
 */
export function AddressStep({ onSubmit }: Props) {
  const { t } = useTranslation();
  const [addressHex, setAddressHex] = useState("");
  const [addressName, setAddressName] = useState("");

  const trimmedAddress = addressHex.trim();
  const addressTouched = trimmedAddress.length > 0;
  const addressValid = isValidAddressHex(trimmedAddress);
  const addressInvalid = addressTouched && !addressValid;

  const nameInvalid = isInvalidAsciiLabel(addressName, LIMITS.addressLabel);
  const nameValid = addressName.trim().length > 0 && !nameInvalid;

  const canSubmit = addressValid && nameValid;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({ addressHex: trimmedAddress, addressName: addressName.trim() });
  };

  return (
    <div
      // `gap-16` here (not 24) because the two inputs + button stack
      // tighter in the Figma frames 13936:20087 / 13957:8439 — they
      // form a single form group. `pt-16` matches the other steps.
      className="flex flex-col gap-16 px-24 pt-16 pb-24"
      data-testid="contacts-management-add-address-address-step"
    >
      <TextInput
        label={t("contactsManagement.addAddress.addressLabel")}
        value={addressHex}
        onChange={e => setAddressHex(e.target.value)}
        status={addressValid ? "success" : addressInvalid ? "error" : undefined}
        helperText={
          addressValid
            ? t("contactsManagement.addAddress.addressValid")
            : addressInvalid
              ? t("contactsManagement.addAddress.addressInvalid")
              : undefined
        }
        data-testid="contacts-management-add-address-hex"
        autoFocus
      />

      <div className="flex flex-col gap-8 w-full">
        <TextInput
          label={t("contactsManagement.addAddress.addressNameLabel")}
          value={addressName}
          onChange={e => setAddressName(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          aria-invalid={nameInvalid}
          suffix={
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  appearance="no-background"
                  size="xs"
                  icon={Information}
                  aria-label={t("contactsManagement.addAddress.nameTooltipAriaLabel")}
                  data-testid="contacts-management-add-address-name-info"
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-280">
                {t("contactsManagement.addAddress.nameTooltip")}
              </TooltipContent>
            </Tooltip>
          }
          data-testid="contacts-management-add-address-name"
        />
        <CharCounter used={addressName.length} limit={LIMITS.addressLabel} />
      </div>

      <Button
        appearance="base"
        size="md"
        isFull
        onClick={submit}
        disabled={!canSubmit}
        data-testid="contacts-management-add-address-submit"
      >
        {t("contactsManagement.addAddress.submit")}
      </Button>
    </div>
  );
}
