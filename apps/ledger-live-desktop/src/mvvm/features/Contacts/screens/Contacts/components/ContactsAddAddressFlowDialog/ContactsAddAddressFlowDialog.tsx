import React from "react";
import { DialogFlow, type DialogFlowScreenRegistry } from "LLD/components/DialogFlow";
import { ModularDialogFlow } from "LLD/features/ModularDialog/ModularDialogFlow";
import {
  ContactsAddAddressEntry,
  ContactsAddAddressCompletion,
  ContactsAddAddressName,
  type AddAddressFlowState,
  type ContactsAddAddressEntryLabels,
  type ContactsAddAddressNameLabels,
} from "@features/flow-contacts";
import type { ContactsAddAddressFlowDialogProps, ContactsAddAddressReviewLabels } from "./types";

type ContactsAddAddressDialogStep = "currency" | "address" | "name" | "review" | "success";

function resolveCurrentStep(state: AddAddressFlowState): ContactsAddAddressDialogStep {
  switch (state.status) {
    case "enteringAddress":
      return "address";
    case "namingAddress":
      return "name";
    case "reviewingAddress":
      return "review";
    case "success":
      return "success";
    case "selectingCurrency":
    case "closed":
      return "currency";
  }
}

function isEnteringAddress(
  state: AddAddressFlowState,
): state is Extract<AddAddressFlowState, { status: "enteringAddress" }> {
  return state.status === "enteringAddress";
}

function createAddressContent(
  state: Extract<AddAddressFlowState, { status: "enteringAddress" }>,
  labels: ContactsAddAddressEntryLabels,
  nameLabels: ContactsAddAddressNameLabels,
  onAddressChange: ContactsAddAddressFlowDialogProps["onAddressChange"],
  onAddressLabelChange: ContactsAddAddressFlowDialogProps["onAddressLabelChange"],
  onContinueFromAddressDetails: ContactsAddAddressFlowDialogProps["onContinueFromAddressDetails"],
): React.JSX.Element {
  return (
    <ContactsAddAddressEntry
      addressEntry={state.addressEntry}
      addressLabel={state.addressLabel}
      labels={labels}
      nameLabels={nameLabels}
      onAddressChange={onAddressChange}
      onAddressLabelChange={onAddressLabelChange}
      onConfirm={onContinueFromAddressDetails}
    />
  );
}

function isNamingAddress(
  state: AddAddressFlowState,
): state is Extract<AddAddressFlowState, { status: "namingAddress" }> {
  return state.status === "namingAddress";
}

function createNameContent(
  state: Extract<AddAddressFlowState, { status: "namingAddress" }>,
  labels: ContactsAddAddressNameLabels,
  onAddressLabelChange: ContactsAddAddressFlowDialogProps["onAddressLabelChange"],
  onContinueFromName: ContactsAddAddressFlowDialogProps["onContinueFromName"],
): React.JSX.Element {
  return (
    <ContactsAddAddressName
      addressEntry={state.addressEntry}
      addressLabel={state.addressLabel}
      labels={labels}
      onAddressLabelChange={onAddressLabelChange}
      onContinue={onContinueFromName}
    />
  );
}

function createCompletionContent(
  state: Extract<AddAddressFlowState, { status: "reviewingAddress" | "success" }>,
  labels: ContactsAddAddressReviewLabels,
  onContinueFromReview: ContactsAddAddressFlowDialogProps["onContinueFromReview"],
  onClose: ContactsAddAddressFlowDialogProps["onClose"],
): React.JSX.Element {
  const isReviewingAddress = state.status === "reviewingAddress";

  return (
    <ContactsAddAddressCompletion
      buttonLabel={isReviewingAddress ? labels.continue : labels.close}
      onContinue={isReviewingAddress ? onContinueFromReview : onClose}
      testID={isReviewingAddress ? "contacts-add-address-review" : "contacts-add-address-success"}
      title={isReviewingAddress ? labels.title : labels.successTitle}
    />
  );
}

export function ContactsAddAddressFlowDialog({
  state,
  entryLabels,
  nameLabels,
  reviewLabels,
  onAddressChange,
  onContinueFromAddressDetails,
  onAddressLabelChange,
  onContinueFromName,
  onContinueFromReview,
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
        const isAddressNaming = isNamingAddress(state);
        const isReviewingAddress = state.status === "reviewingAddress";
        const isSuccess = state.status === "success";
        const currentStep = resolveCurrentStep(state);
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
              ? createAddressContent(
                  state,
                  entryLabels,
                  nameLabels,
                  onAddressChange,
                  onAddressLabelChange,
                  onContinueFromAddressDetails,
                )
              : modularDialog.content,
            options: {
              dialogHeaderProps: { density: "expanded", title: entryLabels.title },
              hasBackButton: true,
            },
          },
          name: {
            content: isAddressNaming
              ? createNameContent(state, nameLabels, onAddressLabelChange, onContinueFromName)
              : modularDialog.content,
            options: {
              dialogHeaderProps: { density: "expanded", title: entryLabels.title },
              hasBackButton: true,
            },
          },
          review: {
            content:
              isReviewingAddress || isSuccess
                ? createCompletionContent(state, reviewLabels, onContinueFromReview, onClose)
                : modularDialog.content,
            options: {
              dialogHeaderProps: { density: "expanded", title: entryLabels.title },
              hasBackButton: true,
            },
          },
          success: {
            content:
              isReviewingAddress || isSuccess
                ? createCompletionContent(state, reviewLabels, onContinueFromReview, onClose)
                : modularDialog.content,
            options: {
              dialogHeaderProps: { density: "expanded", title: entryLabels.title },
              hasBackButton: false,
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
            onBack={
              isAddressEntry || isAddressNaming || isReviewingAddress
                ? onBack
                : modularDialog.onBack
            }
            onClose={onClose}
            screens={screens}
          />
        );
      }}
    </ModularDialogFlow>
  );
}
