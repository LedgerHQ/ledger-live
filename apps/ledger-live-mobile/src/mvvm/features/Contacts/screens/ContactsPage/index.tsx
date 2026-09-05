import React, { useCallback, useLayoutEffect } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Contact } from "@domain/entity-contact";
import { isContactsSearchNoResultsViewModel } from "@features/flow-contacts";
import { useContactsFeature } from "@features/platform-contacts";
import { ScreenName } from "~/const";
import type { MyWalletNavigatorStackParamList } from "LLM/features/MyWallet/types";
import { ContactAddressPicker } from "@features/flow-pay-contact";
import { usePayTabNewPayment } from "LLM/features/PayTab/hooks/usePayTabNewPayment";
import { TrackScreen } from "~/analytics";
import { ContactsPageContent } from "./components/ContactsPageContent";
import { useContactsAddContactDrawerAdapter } from "./hooks/useContactsAddContactDrawerAdapter";
import { useContactsPageNavigationViewModel } from "./hooks/useContactsPageNavigationViewModel";
import { useContactsPageViewModel } from "./hooks/useContactsPageViewModel";

function ContactsScreenRedirect() {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();

  useLayoutEffect(() => {
    navigation.goBack();
  }, [navigation]);

  return null;
}

type ContactsScreenBodyProps = Readonly<{
  title?: string;
  onSelectContact?: (contact: Contact) => void;
}>;

function ContactsScreenBody({ title, onSelectContact }: ContactsScreenBodyProps) {
  const pageViewModel = useContactsPageViewModel(onSelectContact);
  const { onSearchQueryChange } = pageViewModel;
  const onSaveSuccess = useCallback(() => {
    onSearchQueryChange("");
  }, [onSearchQueryChange]);
  const addContactDrawer = useContactsAddContactDrawerAdapter(onSaveSuccess);
  const onAddContact = useCallback(() => {
    pageViewModel.onRequestAddContact(addContactDrawer.onOpen);
  }, [addContactDrawer.onOpen, pageViewModel]);
  const viewModel = {
    ...pageViewModel,
    onAddContact,
    addContactDrawer,
  };

  useContactsPageNavigationViewModel(
    pageViewModel.labels.addContact,
    !isContactsSearchNoResultsViewModel(pageViewModel.viewModel),
    onAddContact,
    title,
  );

  return <ContactsPageContent {...viewModel} />;
}

function ContactsPaySelectContent({ title }: Readonly<{ title?: string }>) {
  const payment = usePayTabNewPayment();

  return (
    <>
      <ContactsScreenBody title={title} onSelectContact={payment.open} />
      <ContactAddressPicker {...payment.contactAddressPicker} />
    </>
  );
}

function ContactsScreenContent() {
  const { params } =
    useRoute<RouteProp<MyWalletNavigatorStackParamList, typeof ScreenName.MyWalletContacts>>();

  if (params?.selectForPay) {
    return <ContactsPaySelectContent title={params.title} />;
  }

  return <ContactsScreenBody title={params?.title} />;
}

export function ContactsScreen() {
  const { isEnabled } = useContactsFeature("mobile");

  if (!isEnabled) {
    return <ContactsScreenRedirect />;
  }

  return (
    <>
      <TrackScreen category="Contacts" />
      <ContactsScreenContent />
    </>
  );
}
