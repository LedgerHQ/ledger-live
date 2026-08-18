import React from "react";
import { Banner, Button, TextInput } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import { CONTACT_ADDRESS_LABEL_MAX_LENGTH } from "@domain/entity-contact";
import type { ContactsAddAddressNameViewProps } from "./types";

export function ContactsAddAddressNameView({
  addressLabel,
  labels,
  validationMessage,
  isContinueEnabled,
  onAddressLabelChange,
  onContinue,
}: ContactsAddAddressNameViewProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-24">
      <TextInput
        autoComplete="off"
        autoCorrect="off"
        data-testid="contacts-add-address-name-input"
        helperText={validationMessage}
        hideClearButton
        label={labels.inputLabel}
        maxCount={CONTACT_ADDRESS_LABEL_MAX_LENGTH}
        maxLength={CONTACT_ADDRESS_LABEL_MAX_LENGTH}
        onChange={onAddressLabelChange}
        spellCheck={false}
        status={addressLabel.status === "invalid" ? "error" : undefined}
        value={addressLabel.value}
      />
      <Banner
        appearance="info"
        data-testid="contacts-add-address-name-disclaimer"
        description={labels.namingDisclaimer}
      />
      <Button
        appearance="base"
        className="w-full"
        data-testid="contacts-add-address-name-continue"
        disabled={!isContinueEnabled}
        icon={LedgerLogo}
        onClick={onContinue}
        size="lg"
      >
        {labels.continueToReview}
      </Button>
    </div>
  );
}
