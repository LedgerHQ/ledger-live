import React from "react";
import { Text, View } from "react-native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { ContactAvatar } from "@features/platform-contacts/native";
import type { RecipientHeaderContact } from "@ledgerhq/live-common/flows/send/recipient/utils/getRecipientHeaderPresentation";
import type { ContactId } from "@domain/entity-contact";

import { AddressDisclaimer } from "./AddressDisclaimer";

type RecipientContactRowProps = Readonly<{
  contact: RecipientHeaderContact;
  label: string;
  value: string;
}>;

export function RecipientContactRow({ contact, label, value }: RecipientContactRowProps) {
  const styles = useStyleSheet(
    theme => ({
      row: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacings.s8,
        minHeight: theme.sizes.s48,
        paddingHorizontal: theme.spacings.s16,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.bg.muted,
      },
      prefix: {
        ...theme.typographies.body1,
        color: theme.colors.text.base,
      },
      name: {
        ...theme.typographies.body1,
        flex: 1,
        color: theme.colors.text.base,
      },
    }),
    [],
  );

  return (
    <View style={styles.row} testID="recipient-contact-row">
      <Text style={styles.prefix}>{label}</Text>
      <ContactAvatar
        contactId={contact.id as ContactId}
        name={contact.name}
        size="xs"
        testID="recipient-contact-avatar"
      />
      <Text style={styles.name} numberOfLines={1}>
        {value}
      </Text>
      <AddressDisclaimer />
    </View>
  );
}
