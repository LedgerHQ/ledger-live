import React from "react";
import { AddressInput, Banner, TextInput } from "@ledgerhq/lumen-ui-react";
import { CONTACT_ADDRESS_LABEL_MAX_LENGTH } from "@domain/entity-contact";
import { SanctionedAddressBanner } from "../../../../components/SanctionedAddressBanner/SanctionedAddressBanner";
import type { ContactsAddAddressEntryWebViewProps } from "../ContactsAddAddressEntry/ContactsAddAddressEntry.types";
import { AddressNameDisclaimer } from "../../../../components/AddressNameDisclaimer/AddressNameDisclaimer";

export function ContactsAddAddressEntryView({
  value,
  labels,
  inputStatus,
  helperText,
  sanctionedAddressBanner,
  showEnsDisclaimer,
  addressLabel,
  nameLabels,
  nameValidationMessage,
  onChange,
  onPaste,
  onAddressLabelChange,
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
            <AddressNameDisclaimer
              accessibilityLabel={nameLabels.namingDisclaimerAccessibilityLabel}
              description={nameLabels.namingDisclaimer}
            />
          }
          value={addressLabel.value}
        />
      ) : null}
      {showEnsDisclaimer ? (
        <Banner
          appearance="info"
          data-testid="contacts-add-address-ens-disclaimer"
          title={labels.ensDisclaimer}
          description={labels.ensDisclaimerDescription}
        />
      ) : null}
      {sanctionedAddressBanner ? <SanctionedAddressBanner {...sanctionedAddressBanner} /> : null}
    </div>
  );
}
