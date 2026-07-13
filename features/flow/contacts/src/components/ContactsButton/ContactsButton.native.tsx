import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
  Tag,
} from "@ledgerhq/lumen-ui-rnative";
import { BookOpen, ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";

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
    <ListItem
      onPress={onPress}
      testID="my-wallet-contacts-button"
      lx={{ backgroundColor: "surface", borderRadius: "md", paddingVertical: "s4" }}
    >
      <ListItemLeading>
        <Spot appearance="icon" icon={BookOpen} size={48} />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription>{description}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
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
      </ListItemTrailing>
    </ListItem>
  );
}
