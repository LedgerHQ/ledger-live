import React from "react";
import { ScrollView } from "react-native";
import {
  Box,
  IconButton,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  SearchInput,
} from "@ledgerhq/lumen-ui-rnative";
import { Plus, UserCircle } from "@ledgerhq/lumen-ui-rnative/symbols";

export type ContactsAddContactHeaderButtonProps = {
  addContactLabel: string;
};

export function ContactsAddContactHeaderButton({
  addContactLabel,
}: Readonly<ContactsAddContactHeaderButtonProps>) {
  return (
    <IconButton
      appearance="no-background"
      size="md"
      icon={Plus}
      disabled
      accessibilityLabel={addContactLabel}
      testID="contacts-add-contact-button"
    />
  );
}

export type ContactsPageContentProps = {
  searchPlaceholder: string;
  addContactLabel: string;
  meName: string;
  meAddressCountLabel: string;
};

export function ContactsPageContent({
  searchPlaceholder,
  addContactLabel,
  meName,
  meAddressCountLabel,
}: Readonly<ContactsPageContentProps>) {
  return (
    <ScrollView testID="contacts-screen">
      <Box lx={{ paddingHorizontal: "s16", paddingTop: "s8", gap: "s16" }}>
        <SearchInput
          appearance="plain"
          placeholder={searchPlaceholder}
          value=""
          editable={false}
          testID="contacts-search-input"
        />
        <ListItem
          lx={{ backgroundColor: "surface", borderRadius: "md", paddingVertical: "s4" }}
          testID="contacts-me-item"
        >
          <ListItemLeading>
            <Box
              lx={{
                backgroundColor: "muted",
                borderRadius: "full",
                width: "s48",
                height: "s48",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserCircle size={20} color="base" />
            </Box>
            <ListItemContent>
              <ListItemTitle>{meName}</ListItemTitle>
              <ListItemDescription>{meAddressCountLabel}</ListItemDescription>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
        <ListItem
          lx={{ backgroundColor: "surface", borderRadius: "md", paddingVertical: "s4" }}
          testID="contacts-add-contact-row"
        >
          <ListItemLeading>
            <Box
              lx={{
                backgroundColor: "muted",
                borderRadius: "full",
                width: "s48",
                height: "s48",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={20} color="base" />
            </Box>
            <ListItemContent>
              <ListItemTitle>{addContactLabel}</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      </Box>
    </ScrollView>
  );
}
