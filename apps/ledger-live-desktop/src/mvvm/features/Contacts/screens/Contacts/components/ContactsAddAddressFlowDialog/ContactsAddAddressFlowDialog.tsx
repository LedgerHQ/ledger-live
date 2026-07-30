import React from "react";
import { DialogFlow, type DialogFlowScreenRegistry } from "LLD/components/DialogFlow";
import { ModularDialogFlow } from "LLD/features/ModularDialog/ModularDialogFlow";
import {
  ContactsAddAddressEntry,
  type AddAddressFlowState,
  type ContactsAddAddressEntryLabels,
} from "@features/flow-contacts";
import type { ContactsAddAddressFlowDialogProps } from "./types";

type ContactsAddAddressDialogStep = "currency" | "address";

function isEnteringAddress(
  state: AddAddressFlowState,
): state is Extract<AddAddressFlowState, { status: "enteringAddress" }> {
  return state.status === "enteringAddress";
}

function createAddressContent(
  state: Extract<AddAddressFlowState, { status: "enteringAddress" }>,
  labels: ContactsAddAddressEntryLabels,
  onAddressChange: ContactsAddAddressFlowDialogProps["onAddressChange"],
): React.JSX.Element {
  return (
    <ContactsAddAddressEntry
      addressEntry={state.addressEntry}
      labels={labels}
      onAddressChange={onAddressChange}
    />
  );
}

export function ContactsAddAddressFlowDialog({
  state,
  labels,
  onAddressChange,
  onBack,
  onClose,
}: ContactsAddAddressFlowDialogProps): React.JSX.Element | null {
  if (state.status === "closed") {
    return null;
  }

  return (
    <ModularDialogFlow onClose={onClose}>
      {modularDialog => {
        const isAddressEntry = isEnteringAddress(state);
        const currentStep: ContactsAddAddressDialogStep = isAddressEntry ? "address" : "currency";
        const screens: DialogFlowScreenRegistry<ContactsAddAddressDialogStep> = {
          currency: {
            content: modularDialog.content,
            options: {
              dialogHeaderProps: {
                density: "expanded",
                description: modularDialog.description,
                title: modularDialog.title,
              },
              hasBackButton: modularDialog.hasBackButton,
            },
          },
          address: {
            content: isAddressEntry
              ? createAddressContent(state, labels, onAddressChange)
              : modularDialog.content,
            options: {
              dialogHeaderProps: { density: "expanded", title: labels.title },
              hasBackButton: true,
            },
          },
        };

        return (
          <DialogFlow
            currentStep={currentStep}
            defaultOptions={{
              dialogBodyProps: { className: "!mb-0 px-24 pb-24 pt-12" },
              dialogContentProps: { className: "w-400 bg-canvas-sheet pb-0" },
            }}
            isOpen
            onBack={isAddressEntry ? onBack : modularDialog.onBack}
            onClose={onClose}
            screens={screens}
          />
        );
      }}
    </ModularDialogFlow>
  );
}
