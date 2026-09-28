import React, { useCallback } from "react";
import { Tile, TileContent, TileDescription } from "@ledgerhq/lumen-ui-rnative";
import { ContactAvatar, useContactDisplayName } from "@features/platform-contacts";
import type { Contact } from "@domain/entity-contact";

type ContactTileProps = Readonly<{
  contact: Contact;
  index: number;
  onPress?: (contact: Contact) => void;
}>;

export function ContactTile({ contact, index, onPress }: ContactTileProps): React.JSX.Element {
  const handlePress = useCallback(() => onPress?.(contact), [contact, onPress]);
  const getDisplayName = useContactDisplayName();

  return (
    <Tile
      onPress={onPress ? handlePress : undefined}
      lx={{ width: "s96", flexGrow: 1, marginLeft: "-s8" }}
      testID={`pay-contacts-tile-${index}`}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={getDisplayName(contact)}
    >
      <ContactAvatar contactId={contact.id} name={contact.name} isMe={contact.isMe} size="lg" />
      <TileContent>
        <TileDescription>{getDisplayName(contact)}</TileDescription>
      </TileContent>
    </Tile>
  );
}
