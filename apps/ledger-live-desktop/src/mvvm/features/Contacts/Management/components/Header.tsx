import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  NavBar,
  NavBarTitle,
  NavBarTrailing,
} from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";

/**
 * Page header for the Contacts management surface.
 *
 * Uses Lumen `NavBar` (matches the Figma frame 13802:2833 and the existing
 * `PageHeader` convention in `mvvm/components/PageHeader/index.tsx`).
 * Title "Contacts" on the leading edge, "Add contact" Button as the
 * trailing slot.
 *
 * The button is intentionally NOT wired (no `onClick`, no `disabled`) so
 * Lumen's hover and press states still render — per the L4 spec the action
 * lands in a follow-up.
 *
 * TODO(contacts-L4.1): wire the "Add contact" button to a Lumen Dialog
 * that runs the L1 panel's `RegisterExternalAddress` form against
 * `useContacts().addContact`.
 */
export function Header() {
  const { t } = useTranslation();

  return (
    <NavBar data-testid="contacts-management-header">
      <NavBarTitle>{t("contactsManagement.title")}</NavBarTitle>
      <NavBarTrailing>
        <Button
          appearance="base"
          size="sm"
          icon={Plus}
          data-testid="contacts-management-add-contact"
        >
          {t("contactsManagement.addContact")}
        </Button>
      </NavBarTrailing>
    </NavBar>
  );
}
