import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Tag,
  TextInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { Information, Paste } from "@ledgerhq/lumen-ui-react/symbols";
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
  /**
   * Initial value for the "Address name" field — pre-filled from the
   * selected crypto's display name (`CryptoOption.name`) so the user
   * lands on a sensible default ("Ethereum", "USD Coin", "BNB", …)
   * and can edit it to taste. Empty string falls through to a blank
   * input (kept for the existing tests that don't pass it).
   */
  defaultAddressName?: string;
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
 * - The name field has a `suffix` 20×20 `Information` icon wrapped
 *   in a Lumen `Tooltip` — hovering surfaces the L4 copy explaining
 *   the name is private/local. We render the bare icon (not an
 *   `IconButton`) per Figma `14198:8264` so the trigger has no
 *   hover/pressed chrome — only the tooltip itself surfaces.
 * - `Register address` Button is disabled until BOTH inputs pass
 *   their validators (matches the disabled/enabled comparison in
 *   13957:8439 → 13957:8939).
 */
export function AddressStep({ onSubmit, defaultAddressName = "" }: Props) {
  const { t } = useTranslation();
  const [addressHex, setAddressHex] = useState("");
  // `useState` only honours its initial value on the FIRST mount; the
  // parent `AddAddressDialog` re-mounts this component every time the
  // step transitions to `address`, so a fresh `defaultAddressName`
  // arrives as a fresh initial state. If the user backtracks and
  // picks a different crypto, the next mount uses that crypto's name.
  const [addressName, setAddressName] = useState(defaultAddressName);

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

  // One-shot clipboard read for the inline Paste affordance. Async +
  // permission-gated in some browsers; Electron's renderer normally
  // grants it but we still silently no-op on rejection so the input
  // stays usable (users can still Cmd+V into the field).
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setAddressHex(text.trim());
    } catch {
      // Clipboard unavailable / permission denied — fall back to the
      // user's native paste shortcut.
    }
  };

  return (
    <div
      // `px-8` composes with DialogBody's `px-16` to land the inputs at
      // 24px from the modal edge — same alignment as the title (which
      // sits at the header's px-24) and the picker steps' rows.
      // `gap-16` here (not 24) because the two inputs + button stack
      // tighter in the Figma frames 13936:20087 / 13957:8439 — they
      // form a single form group.
      // Vertical padding (`pt-8 pb-24`) is owned by the parent
      // `DialogBody` — see the comment block on `AddAddressDialog`'s
      // body className.
      className="flex flex-col gap-16 px-8"
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
        // Hide Lumen's intrinsic clear-button — the user can wipe the
        // input with their keyboard; the affordance is just noise.
        hideClearButton
        // Inline Paste affordance (Figma frame `14197:12819`). Only
        // rendered while the field is empty — once the user starts
        // typing the tag would overlap their text. Lumen `Tag` is a
        // `div` by default, so we tag it `role="button"` for a11y
        // and wire the clipboard read via `onClick`.
        suffix={
          trimmedAddress.length === 0 ? (
            <Tag
              appearance="gray"
              size="sm"
              icon={Paste}
              label={t("contactsManagement.addAddress.paste")}
              role="button"
              tabIndex={0}
              aria-label={t("contactsManagement.addAddress.pasteAriaLabel")}
              onClick={handlePaste}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  void handlePaste();
                }
              }}
              className="cursor-pointer"
              data-testid="contacts-management-add-address-paste"
            />
          ) : undefined
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
          // Hide Lumen's intrinsic clear button — the info tooltip
          // (`suffix`) already occupies the right side of the input.
          hideClearButton
          suffix={
            <Tooltip>
              {/*
                Bare `Information` icon as the tooltip trigger — NOT a
                Lumen `IconButton`. The Figma frame `14198:8264` shows
                a plain 20×20 glyph with no background and no
                hover / pressed chrome; only the tooltip itself
                surfaces on hover. `IconButton appearance="no-background"`
                still ships hover/pressed bg tokens that we'd have to
                override one by one. Default arrow ("normal select")
                cursor on hover — explicit `cursor-default` so the
                icon doesn't inherit a text-select cursor from the
                surrounding input flow. `tabIndex={0}` keeps keyboard
                users able to focus the trigger and surface the
                tooltip.
              */}
              <TooltipTrigger asChild>
                <Information
                  size={20}
                  role="img"
                  tabIndex={0}
                  aria-label={t("contactsManagement.addAddress.nameTooltipAriaLabel")}
                  className="text-muted cursor-default focus:outline-none"
                  data-testid="contacts-management-add-address-name-info"
                />
              </TooltipTrigger>
              {/*
                `whitespace-pre-line` honours the explicit `\n` line
                breaks in the i18n string so the copy always renders
                as 3 balanced lines — width-based wrapping alone
                produced awkward breaks (orphan "It" at the end of
                line 2, or a single-line layout on wider tooltips).
              */}
              <TooltipContent side="top" className="max-w-280 whitespace-pre-line text-center">
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
