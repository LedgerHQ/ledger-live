import React from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  Spot,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, Contact } from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactsButtonProps } from "./ContactsButton.types";

export function ContactsButton({
  title,
  description,
  newBadgeLabel,
  onOpenContacts,
  testID = "my-wallet-contacts-button",
}: ContactsButtonProps) {
  return (
    <Card type="interactive" onClick={onOpenContacts} data-testid={testID}>
      <CardHeader>
        <CardLeading>
          <Spot icon={Contact} />
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
            <CardContentDescription>{description}</CardContentDescription>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          {newBadgeLabel ? (
            <Tag
              label={newBadgeLabel}
              appearance="accent"
              size="md"
              data-testid="contacts-button-new-badge"
            />
          ) : null}
          <ChevronRight size={24} />
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}
