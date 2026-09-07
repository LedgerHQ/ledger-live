import React, { useCallback, useMemo } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import type { Contact } from "@domain/entity-contact";
import { ContactAddressPicker } from "@features/flow-pay-contact";
import { ContactsCompactRow } from "@features/flow-contacts-list";
import {
  AddressInput,
  NavBar,
  NavBarBackButton,
  NavBarContent,
  NavBarTitle,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "@shared/i18n";
import { RecipientEmptyContactsState } from "LLM/features/Send/screens/Recipient/components/RecipientEmptyContactsState";
import type { PayTabSelectContactViewModel } from "./usePayTabSelectContactViewModel";

const ESTIMATED_ITEM_SIZE = 72;
const DRAW_DISTANCE = ESTIMATED_ITEM_SIZE * 5;

const keyExtractor = (contact: Contact) => contact.id;

export function PayTabSelectContactView({
  searchValue,
  setSearchValue,
  clearSearch,
  contacts,
  showEmptyContactsState,
  handleBack,
  handleContactSelect,
  contactAddressPicker,
}: PayTabSelectContactViewModel) {
  const { t } = useTranslation();
  const contactLabels = useMemo(
    () => ({
      emptyAddress: t("contacts.addressCount", { count: 0 }),
      formatAddressCount: (count: number) => t("contacts.addressCount", { count }),
    }),
    [t],
  );
  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
      addressInput: {
        marginTop: theme.spacings.s8,
        paddingHorizontal: theme.spacings.s16,
      },
      body: {
        flex: 1,
        paddingVertical: theme.spacings.s24,
        paddingHorizontal: theme.spacings.s8,
      },
      list: {
        flex: 1,
      },
    }),
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Contact>) => (
      <ContactsCompactRow
        contact={item}
        labels={contactLabels}
        onContactSelect={handleContactSelect}
      />
    ),
    [contactLabels, handleContactSelect],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]} testID="pay-select-contact">
      <NavBar density="compact">
        <NavBarBackButton onPress={handleBack} accessibilityLabel={t("common.back")} />
        <NavBarContent>
          <NavBarTitle>{t("transfer.send.title")}</NavBarTitle>
        </NavBarContent>
      </NavBar>
      <View style={styles.addressInput}>
        <AddressInput
          testID="recipient-input"
          prefix={t("send.newSendFlow.to")}
          value={searchValue}
          onChangeText={setSearchValue}
          onClear={clearSearch}
          placeholder={t("payTab.selectContact.placeholder")}
        />
      </View>
      <View style={styles.body}>
        {showEmptyContactsState ? (
          <RecipientEmptyContactsState />
        ) : (
          <FlashList
            testID="pay-select-contact-list"
            style={styles.list}
            data={contacts}
            extraData={handleContactSelect}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            drawDistance={DRAW_DISTANCE}
            ListHeaderComponent={
              <Subheader>
                <SubheaderRow lx={{ marginBottom: "s4" }}>
                  <SubheaderTitle>{t("contacts.title")}</SubheaderTitle>
                </SubheaderRow>
              </Subheader>
            }
          />
        )}
      </View>
      <ContactAddressPicker {...contactAddressPicker} />
    </SafeAreaView>
  );
}
