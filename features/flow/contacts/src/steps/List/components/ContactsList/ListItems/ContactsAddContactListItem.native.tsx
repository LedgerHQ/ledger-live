import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";

type ContactsAddContactListItemProps = Readonly<{
  label: string;
  onPress: () => void;
}>;

export function ContactsAddContactListItem({
  label,
  onPress,
}: ContactsAddContactListItemProps): React.JSX.Element {
  return (
    <ListItem
      testID="contacts-add-contact-row"
      onPress={onPress}
      density="expanded"
      lx={{ marginHorizontal: "-s8" }}
    >
      <ListItemLeading>
        <Spot appearance="icon" size={48} icon={Plus} />
        <ListItemContent>
          <ListItemTitle>{label}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
