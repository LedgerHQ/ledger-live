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
 * The "Add contact" button is wired up to open `AddContactDialog` (the
 * parent — `ManagementView` — owns the open state and creation handler;
 * `Header` just bubbles the click).
 *
 * TODO(contacts-L4.1): once DMK ships a fire-and-forget contact-add
 * verb, the sidecar walk-into-canonical migration runs here on submit.
 */
type Props = {
  onAddContact: () => void;
};

export function Header({ onAddContact }: Props) {
  const { t } = useTranslation();

  return (
    <NavBar data-testid="contacts-management-header">
      <NavBarTitle>{t("contactsManagement.title")}</NavBarTitle>
      <NavBarTrailing>
        <Button
          appearance="base"
          size="sm"
          icon={Plus}
          onClick={onAddContact}
          data-testid="contacts-management-add-contact"
        >
          {t("contactsManagement.addContact")}
        </Button>
      </NavBarTrailing>
    </NavBar>
  );
}
