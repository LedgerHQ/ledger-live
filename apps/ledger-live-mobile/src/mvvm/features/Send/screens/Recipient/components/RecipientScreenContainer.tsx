import React from "react";
import { AddNewContactView } from "LLM/features/Send/screens/AddNewContact/AddNewContactView";
import { useAddNewContactViewModel } from "LLM/features/Send/screens/AddNewContact/hooks/useAddNewContactViewModel";
import { useRecipientScreenContentViewModel } from "../hooks/useRecipientScreenContentViewModel";
import type { ReadyRecipientScreenViewModel } from "../hooks/useRecipientScreenViewModel";
import { RecipientScreenView } from "./RecipientScreenView";

type RecipientScreenContainerProps = Readonly<{
  screenViewModel: ReadyRecipientScreenViewModel;
}>;

export function RecipientScreenContainer({ screenViewModel }: RecipientScreenContainerProps) {
  const addNewContact = useAddNewContactViewModel();
  const viewModel = useRecipientScreenContentViewModel({
    ...screenViewModel,
    onAddContact: addNewContact.onOpen,
  });

  return (
    <>
      <RecipientScreenView viewModel={viewModel} />
      <AddNewContactView {...addNewContact} />
    </>
  );
}
