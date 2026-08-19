import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { ContactNameInput } from "../../components/ContactNameInput/ContactNameInput.web";
import { ContactsAddContactNamingDisclaimer } from "../../components/ContactsAddContactNamingDisclaimer.web";
import type { ContactsAddContactContentProps } from "./types";

const NAMING_DISCLAIMER_ID = "contacts-add-contact-naming-disclaimer";

export function ContactsAddContactContent({
  isConfirmEnabled,
  isSaving,
  draftName,
  invalidNameError,
  labels,
  onDraftNameChange,
  onConfirm,
}: ContactsAddContactContentProps): React.ReactNode {
  const nameValidationError =
    invalidNameError === null ? undefined : labels.nameValidationErrors[invalidNameError];

  return (
    <div aria-describedby={NAMING_DISCLAIMER_ID} className="flex flex-col gap-24 px-24 pb-24 pt-12">
      <ContactNameInput
        value={draftName}
        placeholder={labels.namePlaceholder}
        errorMessage={nameValidationError}
        isEditable={!isSaving}
        onChange={onDraftNameChange}
      />
      <ContactsAddContactNamingDisclaimer
        disclaimerId={NAMING_DISCLAIMER_ID}
        text={labels.namingDisclaimer}
      />
      <Button
        appearance="base"
        size="lg"
        className="w-full"
        disabled={!isConfirmEnabled}
        loading={isSaving}
        onClick={() => void onConfirm()}
        data-testid="contacts-add-contact-save"
      >
        {labels.confirmName}
      </Button>
    </div>
  );
}
