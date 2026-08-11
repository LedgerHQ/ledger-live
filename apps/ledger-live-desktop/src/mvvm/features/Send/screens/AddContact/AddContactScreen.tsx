import React from "react";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import { AddContactView } from "./AddContactView";

export function AddContactScreen() {
  return (
    <DialogBody className="px-16 pb-24">
      <AddContactView />
    </DialogBody>
  );
}
