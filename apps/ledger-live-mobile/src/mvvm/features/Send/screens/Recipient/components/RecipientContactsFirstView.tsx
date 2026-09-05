import type { Contact } from "@domain/entity-contact";
import React, { useCallback, useMemo } from "react";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { ContactAddressPicker, type ContactAddressPickerProps } from "@features/flow-pay-contact";
import { ContactsCompactRow } from "@features/flow-contacts-list";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { SendFlowLayout } from "LLM/features/Send/components/SendFlowLayout";
import { useTranslation } from "~/context/Locale";
import { RecipientEmptyContactsState } from "./RecipientEmptyContactsState";

type RecipientContactsFirstViewProps = Readonly<{
  contacts: readonly Contact[];
  onSelectContact: (contact: Contact) => void;
  contactAddressPicker: ContactAddressPickerProps;
}>;

const LIST_STYLE = { flex: 1, marginHorizontal: -8 } as const;
const ESTIMATED_ITEM_SIZE = 72;
const DRAW_DISTANCE = ESTIMATED_ITEM_SIZE * 5;

const keyExtractor = (contact: Contact) => contact.id;

function ContactsListHeader() {
  const { t } = useTranslation();

  return (
    <Box lx={{ marginHorizontal: "s8" }} testID="send-recipient-contacts">
      <Subheader>
        <SubheaderRow lx={{ marginBottom: "s4" }}>
          <SubheaderTitle>{t("contacts.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
    </Box>
  );
}

export function RecipientContactsFirstView({
  contacts,
  onSelectContact,
  contactAddressPicker,
}: RecipientContactsFirstViewProps) {
  const { t } = useTranslation();
  const labels = useMemo(
    () => ({
      emptyAddress: t("contacts.addressCount", { count: 0 }),
      formatAddressCount: (count: number) => t("contacts.addressCount", { count }),
    }),
    [t],
  );
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Contact>) => (
      <ContactsCompactRow contact={item} labels={labels} onContactSelect={onSelectContact} />
    ),
    [labels, onSelectContact],
  );

  return (
    <>
      <SendFlowLayout>
        {contacts.length === 0 ? (
          <RecipientEmptyContactsState />
        ) : (
          <FlashList
            testID="send-recipient-contacts-list"
            data={contacts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={ContactsListHeader}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            drawDistance={DRAW_DISTANCE}
            style={LIST_STYLE}
          />
        )}
      </SendFlowLayout>
      <ContactAddressPicker {...contactAddressPicker} />
    </>
  );
}
