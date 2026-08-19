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
import { ChevronRight, Contact } from "@ledgerhq/lumen-ui-rnative/symbols";

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
        <CardTrailing>
          {newBadgeLabel ? (
            <Tag
              label={newBadgeLabel}
              appearance="accent"
              size="md"
              testID="contacts-button-new-badge"
            />
          ) : (
            <ChevronRight size={24} color="muted" />
          )}
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}
