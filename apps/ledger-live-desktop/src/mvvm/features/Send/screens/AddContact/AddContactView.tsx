import React from "react";
import { useTranslation } from "react-i18next";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Contact, Plus } from "@ledgerhq/lumen-ui-react/symbols";

export type AddContactViewProps = Readonly<{
  onAddNewContact?: () => void;
  onAddToExistingContact?: () => void;
}>;

export function AddContactView({ onAddNewContact, onAddToExistingContact }: AddContactViewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col" data-testid="send-add-contact-step">
      <ListItem onClick={onAddNewContact} data-testid="send-add-contact-new">
        <ListItemLeading>
          <Spot appearance="icon" icon={Plus} />
          <ListItemContent>
            <ListItemTitle>{t("newSendFlow.addContact.newContact")}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
      </ListItem>
      <ListItem onClick={onAddToExistingContact} data-testid="send-add-contact-existing">
        <ListItemLeading>
          <Spot appearance="icon" icon={Contact} />
          <ListItemContent>
            <ListItemTitle>{t("newSendFlow.addContact.existingContact")}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
      </ListItem>
    </div>
  );
}
