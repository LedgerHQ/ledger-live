import React, { useCallback } from "react";
import { Tile, TileContent, TileTitle } from "@ledgerhq/lumen-ui-rnative";
import { ContactAvatar } from "@features/platform-contacts";
import type { Contact } from "@domain/entity-contact";

type ContactTileProps = Readonly<{
  contact: Contact;
  index: number;
  onPress?: (contact: Contact) => void;
}>;

export function ContactTile({ contact, index, onPress }: ContactTileProps): React.JSX.Element {
  const handlePress = useCallback(() => onPress?.(contact), [contact, onPress]);

  return (
    <Tile
      onPress={onPress ? handlePress : undefined}
      lx={{ width: "s96", flexGrow: 1, marginLeft: "-s8" }}
      testID={`pay-contacts-tile-${index}`}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={contact.name}
    >
      <ContactAvatar contactId={contact.id} name={contact.name} size="lg" />
      <TileContent>
        <TileTitle lx={{ color: "muted" }}>{contact.name}</TileTitle>
      </TileContent>
    </Tile>
  );
}
