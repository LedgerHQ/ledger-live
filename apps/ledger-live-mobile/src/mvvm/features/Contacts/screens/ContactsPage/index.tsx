import React, { useCallback, useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useContactsFeature } from "@features/flow-contacts";
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
  const pageViewModel = useContactsPageViewModel();
  const { onSearchQueryChange } = pageViewModel;
  const onSaveSuccess = useCallback(() => {
    onSearchQueryChange("");
  }, [onSearchQueryChange]);
  const addContactDrawer = useContactsAddContactDrawerAdapter(onSaveSuccess);
  const viewModel = {
    ...pageViewModel,
    onAddContact: addContactDrawer.onOpen,
    addContactDrawer,
  };

  useContactsPageNavigationViewModel(pageViewModel.labels.addContact, addContactDrawer.onOpen);

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
