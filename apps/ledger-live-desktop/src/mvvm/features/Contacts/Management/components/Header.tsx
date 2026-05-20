import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";

/**
 * Page header for the Contacts management surface.
 *
 * Title on the left, "Add contact" button on the top-right. The button is
 * intentionally NOT wired (no `onClick`, no `disabled`) so hover and press
 * states still render — per the L4 spec the action lands in a follow-up.
 *
 * TODO(contacts-L4.1): wire the "Add contact" button to a Lumen Dialog that
 * runs the L1 panel's `RegisterExternalAddress` form against
 * `useContacts().addContact`.
 */
export function Header() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-24 py-16">
      <h1 className="heading-3 text-base">{t("contactsManagement.title")}</h1>
      <Button
        appearance="base"
        size="md"
        icon={Plus}
        data-testid="contacts-management-add-contact"
      >
        {t("contactsManagement.addContact")}
      </Button>
    </div>
  );
}
