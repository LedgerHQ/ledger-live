import React, { useId } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { ContactNameDisclaimer, ContactNameInput } from "@features/platform-contacts";
import type { ContactsAddContactContentProps } from "./types";

export function ContactsAddContactContent({
  isConfirmEnabled,
  isSaving,
  draftName,
  invalidNameError,
  labels,
  onDraftNameChange,
  onConfirm,
}: ContactsAddContactContentProps): React.ReactNode {
  const namingDisclaimerId = useId();
  const nameValidationError =
    invalidNameError === null ? undefined : labels.nameValidationErrors[invalidNameError];

  return (
    <div aria-describedby={namingDisclaimerId} className="flex flex-col gap-24 px-24 pb-24 pt-12">
      <ContactNameInput
        value={draftName}
        placeholder={labels.namePlaceholder}
        errorMessage={nameValidationError}
        isEditable={!isSaving}
        onChange={onDraftNameChange}
      />
      <ContactNameDisclaimer disclaimerId={namingDisclaimerId} text={labels.namingDisclaimer} />
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
