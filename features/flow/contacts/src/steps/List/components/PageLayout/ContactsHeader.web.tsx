import React from "react";
import { Button, NavBar, NavBarTitle, NavBarTrailing } from "@ledgerhq/lumen-ui-react";
import { UserAdd } from "@ledgerhq/lumen-ui-react/symbols";

type ContactsHeaderProps = Readonly<{
  title: string;
  addContactLabel: string;
  onAddContact: () => void;
}>;

export function ContactsHeader({
  title,
  addContactLabel,
  onAddContact,
}: ContactsHeaderProps): React.ReactNode {
  return (
    <NavBar data-testid="contacts-page-header">
      <NavBarTitle as="h1">{title}</NavBarTitle>
      <NavBarTrailing>
        <Button
          appearance="base"
          size="md"
          icon={UserAdd}
          onClick={onAddContact}
          data-testid="contacts-add-contact-header"
          className="shrink-0 whitespace-nowrap"
        >
          {addContactLabel}
        </Button>
      </NavBarTrailing>
    </NavBar>
  );
}
