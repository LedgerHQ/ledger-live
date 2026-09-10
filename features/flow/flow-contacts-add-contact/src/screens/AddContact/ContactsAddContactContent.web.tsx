import React, { useId } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import { ContactNameDisclaimer, ContactNameInput } from "@features/platform-contacts";
import type { ContactsAddContactContentProps } from "./types";

export function ContactsAddContactContent({
  isConfirmEnabled,
  isSaving,
  draftName,
  invalidNameError,
  onDraftNameChange,
  onConfirm,
}: ContactsAddContactContentProps): React.ReactNode {
  const { t } = useTranslation();
  const namingDisclaimerId = useId();
  const nameValidationErrors = {
    InvalidContactNameError: t("contacts.addContactDrawer.invalidNameError"),
    DuplicateContactNameError: t("contacts.addContactDrawer.duplicateNameError"),
  };
  const nameValidationError =
    invalidNameError === null ? undefined : nameValidationErrors[invalidNameError];

  return (
    <div aria-describedby={namingDisclaimerId} className="flex flex-col gap-24 px-24 pb-24 pt-12">
      <ContactNameInput
        value={draftName}
        placeholder={t("contacts.addContactDrawer.namePlaceholder")}
        errorMessage={nameValidationError}
        isEditable={!isSaving}
        onChange={onDraftNameChange}
      />
      <ContactNameDisclaimer
        disclaimerId={namingDisclaimerId}
        text={t("contacts.addContactDrawer.namingDisclaimer")}
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
        {t("contacts.addContactDrawer.confirmName")}
      </Button>
    </div>
  );
}
