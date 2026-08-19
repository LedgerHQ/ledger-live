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

export type ContactsButtonProps = {
  title: string;
  description: string;
  newBadgeLabel?: string;
  onClick: () => void;
};

export function ContactsButton({
  title,
  description,
  newBadgeLabel,
  onClick,
}: Readonly<ContactsButtonProps>) {
  return (
    <Card onClick={onClick} data-testid="my-wallet-contacts-button">
      <CardHeader>
        <CardLeading>
          <Spot icon={Contact} appearance="icon" />
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
