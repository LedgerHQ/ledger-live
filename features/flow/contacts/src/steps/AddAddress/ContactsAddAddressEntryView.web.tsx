import React from "react";
import {
  AddressInput,
  Banner,
  Button,
  InteractiveIcon,
  TextInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { InformationFill, LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import { CONTACT_ADDRESS_LABEL_MAX_LENGTH } from "@domain/entity-contact";
import type { ContactsAddAddressEntryWebViewProps } from "./ContactsAddAddressEntry.web.types";

export function ContactsAddAddressEntryView({
  value,
  labels,
  inputStatus,
  helperText,
  showEnsDisclaimer,
  addressLabel,
  nameLabels,
  nameValidationMessage,
  isConfirmEnabled,
  onChange,
  onPaste,
  onAddressLabelChange,
  onConfirm,
}: ContactsAddAddressEntryWebViewProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-24">
      <AddressInput
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        data-testid="contacts-add-address-input"
        helperText={helperText}
        onChange={onChange}
        onPaste={onPaste}
        placeholder={labels.addressPlaceholder}
        prefix=""
        spellCheck={false}
        status={inputStatus}
        value={value}
      />
      {showEnsDisclaimer ? (
        <Banner
          appearance="info"
          data-testid="contacts-add-address-ens-disclaimer"
          description={labels.ensDisclaimer}
        />
      ) : null}
      {addressLabel && nameLabels && onAddressLabelChange ? (
        <TextInput
          autoComplete="off"
          autoCorrect="off"
          data-testid="contacts-add-address-name-input"
          helperText={nameValidationMessage}
          hideClearButton
          label={nameLabels.inputLabel}
          maxCount={CONTACT_ADDRESS_LABEL_MAX_LENGTH}
          maxLength={CONTACT_ADDRESS_LABEL_MAX_LENGTH}
          onChange={onAddressLabelChange}
          spellCheck={false}
          status={addressLabel.status === "invalid" ? "error" : undefined}
          suffix={
            <Tooltip>
              <TooltipTrigger asChild>
                <InteractiveIcon
                  aria-label={nameLabels.namingDisclaimerAccessibilityLabel}
                  data-testid="contacts-add-address-name-disclaimer"
                  icon={InformationFill}
                  iconType="filled"
                  size={20}
                  type="button"
                />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-256 text-center">{nameLabels.namingDisclaimer}</div>
              </TooltipContent>
            </Tooltip>
          }
          value={addressLabel.value}
        />
      ) : null}
      <Button
        appearance="base"
        className="w-full"
        data-testid="contacts-add-address-confirm"
        disabled={!isConfirmEnabled}
        icon={LedgerLogo}
        onClick={onConfirm}
        size="lg"
      >
        {labels.confirmAddress}
      </Button>
    </div>
  );
}
