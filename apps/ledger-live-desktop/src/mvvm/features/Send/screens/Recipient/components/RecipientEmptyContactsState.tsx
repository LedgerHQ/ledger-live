import React from "react";
import { useTranslation } from "react-i18next";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { Contact } from "@ledgerhq/lumen-ui-react/symbols";

export function RecipientEmptyContactsState() {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-10 px-24 py-128"
      data-testid="send-recipient-empty-contacts-state"
    >
      <Spot appearance="icon" icon={Contact} size={72} />
      <p className="text-center body-2 text-muted py-24">{t("newSendFlow.contactsWillAppear")}</p>
    </div>
  );
}
