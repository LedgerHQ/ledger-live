import React, { useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useContactsFeature } from "@features/flow-contacts";
import { TrackScreen } from "~/analytics";
import { ContactsView } from "./ContactsView";
import { useContactsAddContactDrawerViewModel } from "./useContactsAddContactDrawerViewModel";
import { useContactsScreenViewModel } from "./useContactsScreenViewModel";
import { useContactsViewModel } from "./useContactsViewModel";

function ContactsScreenRedirect() {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();

  useLayoutEffect(() => {
    navigation.goBack();
  }, [navigation]);

  return null;
}

function ContactsScreenContent() {
  const pageViewModel = useContactsViewModel();
  const addContactDrawer = useContactsAddContactDrawerViewModel(() => {
    pageViewModel.onSearchQueryChange("");
  });
  const viewModel = {
    ...pageViewModel,
    onAddContact: addContactDrawer.onOpen,
    addContactDrawer,
  };

  useContactsScreenViewModel(pageViewModel.labels.addContact, addContactDrawer.onOpen);

  return <ContactsView {...viewModel} />;
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
