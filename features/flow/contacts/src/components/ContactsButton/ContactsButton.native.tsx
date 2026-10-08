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

export type ContactsButtonProps = {
  title: string;
  description: string;
  newBadgeLabel?: string;
  onPress: () => void;
};

export function ContactsButton({
  title,
  description,
  newBadgeLabel,
  onPress,
}: Readonly<ContactsButtonProps>) {
  return (
    <Card type="interactive" onPress={onPress} testID="my-wallet-contacts-button">
      <CardHeader>
        <CardLeading>
          <Spot appearance="icon" icon={Contact} size={48} />
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
