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
} from "@ledgerhq/lumen-ui-rnative";
import { Contact } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ContactsButtonProps } from "./ContactsButton.types";

export function ContactsButton({
  title,
  description,
  newBadgeLabel,
  onOpenContacts,
  testID = "my-wallet-contacts-button",
}: ContactsButtonProps) {
  return (
    <Card type="interactive" onPress={onOpenContacts} testID={testID}>
      <CardHeader>
        <CardLeading>
          <Spot icon={Contact} size={48} />
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
            <CardContentDescription>{description}</CardContentDescription>
          </CardContent>
        </CardLeading>
        {newBadgeLabel ? (
          <CardTrailing>
            <Tag
              label={newBadgeLabel}
              appearance="accent"
              size="md"
              testID="contacts-button-new-badge"
            />
          </CardTrailing>
        ) : null}
      </CardHeader>
    </Card>
  );
}
