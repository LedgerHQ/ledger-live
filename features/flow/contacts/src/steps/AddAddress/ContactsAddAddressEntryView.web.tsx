import React from "react";
import { AddressInput, Banner, Button } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactsAddAddressEntryWebViewProps } from "./ContactsAddAddressEntry.web.types";

export function ContactsAddAddressEntryView({
  value,
  labels,
  inputStatus,
  helperText,
  showEnsDisclaimer,
  isConfirmEnabled,
  onChange,
  onPaste,
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
