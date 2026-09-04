import React from "react";
import { ScrollView } from "react-native";
import {
  Box,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
} from "@ledgerhq/lumen-ui-rnative";
import { PayTile } from "../PayTile/PayTile.native";
import { ContactTile } from "../ContactTile/ContactTile.native";
import type { ContactsViewNativeProps } from "../../types";

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
        {contacts.map((contact, index) => (
          <ContactTile key={contact.id} contact={contact} index={index} onPress={onContactPress} />
        ))}
      </ScrollView>
    </Box>
  );
}
