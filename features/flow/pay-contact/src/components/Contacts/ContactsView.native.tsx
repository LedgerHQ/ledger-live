import React from "react";
import { ScrollView } from "react-native";
import {
  Box,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
} from "@ledgerhq/lumen-ui-rnative";
import type { Contact } from "@domain/entity-contact";
import { PayTile } from "../PayTile/PayTile";
import { ContactTile } from "../ContactTile/ContactTile";
import type { ContactsNativeProps } from "./Contacts";

export type ContactsViewNativeProps = ContactsNativeProps &
  Readonly<{
    title: string;
    payLabel: string;
    contacts: readonly Contact[];
    hasMore: boolean;
  }>;

const HEIGHT = 108;
const PADDING_HORIZONTAL = 0;
const MARGIN_HORIZONTAL = -16;

export function ContactsView({
  title,
  payLabel,
  contacts,
  hasMore,
  onPay,
  onContactPress,
  onSeeAll,
}: ContactsViewNativeProps): React.JSX.Element {
  return (
    <Box testID="pay-contacts">
      <Subheader testID="pay-contacts-title">
        <SubheaderRow
          lx={{ marginBottom: "s12" }}
          onPress={hasMore ? onSeeAll : undefined}
          testID="pay-contacts-see-all"
        >
          <SubheaderTitle>{title}</SubheaderTitle>
          {hasMore && <SubheaderShowMore />}
        </SubheaderRow>
      </Subheader>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        testID="pay-contacts-list"
        contentContainerStyle={{ paddingHorizontal: PADDING_HORIZONTAL, height: HEIGHT }}
        style={{ marginHorizontal: MARGIN_HORIZONTAL }}
      >
        <PayTile label={payLabel} onPress={onPay} />
        {contacts.map(contact => (
          <ContactTile key={contact.id} contact={contact} onPress={onContactPress} />
        ))}
      </ScrollView>
    </Box>
  );
}
