import React, { useCallback, useLayoutEffect } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { isContactsSearchNoResultsViewModel } from "@features/flow-contacts";
import { useContactsFeature } from "@features/platform-contacts";
import { ScreenName } from "~/const";
import type { MyWalletNavigatorStackParamList } from "LLM/features/MyWallet/types";
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

function ContactsScreenContent() {
  const { params } =
    useRoute<RouteProp<MyWalletNavigatorStackParamList, typeof ScreenName.MyWalletContacts>>();
  const pageViewModel = useContactsPageViewModel();
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
    params?.title,
  );

  return <ContactsPageContent {...viewModel} />;
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
