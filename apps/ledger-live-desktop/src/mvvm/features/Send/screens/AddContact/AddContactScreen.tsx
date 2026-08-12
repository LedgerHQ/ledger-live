import React from "react";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import { AddContactView } from "./AddContactView";
import { useAddContactViewModel } from "./hooks/useAddContactViewModel";

export function AddContactScreen() {
  const { onAddNewContact, onAddToExistingContact } = useAddContactViewModel();

  return (
    <DialogBody className="-mt-12 px-16 pb-24">
      <AddContactView
        onAddNewContact={onAddNewContact}
        onAddToExistingContact={onAddToExistingContact}
      />
    </DialogBody>
  );
}
