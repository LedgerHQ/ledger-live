import React from "react";
import { DialogFlow, type DialogFlowScreenRegistry } from "LLD/components/DialogFlow";
import { ModularDialogFlow } from "LLD/features/ModularDialog/ModularDialogFlow";
import {
  ContactsAddAddressFlowContent,
  resolveAddAddressWebFlowStep,
  shouldUseAddAddressFlowBackNavigation,
  type AddAddressWebFlowStep,
} from "@features/flow-contacts";
import type { ContactsAddAddressFlowDialogProps } from "./types";

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
  onCompleteMockConfirmation,
  onBack,
  onClose,
}: ContactsAddAddressFlowDialogProps): React.JSX.Element | null {
  if (state.status === "closed") {
    return null;
  }

  return (
    <ModularDialogFlow onClose={onClose}>
      {modularDialog => {
        const currentStep = resolveAddAddressWebFlowStep(state);
        const flowContent =
          state.status === "selectingCurrency" ? (
            modularDialog.content
          ) : (
            <ContactsAddAddressFlowContent
              completionLabels={reviewLabels}
              entryLabels={entryLabels}
              nameLabels={nameLabels}
              onAddressChange={onAddressChange}
              onAddressLabelChange={onAddressLabelChange}
              onClose={onClose}
              onContinueFromAddressDetails={onContinueFromAddressDetails}
              onContinueFromName={onContinueFromName}
              onContinueFromReview={onContinueFromReview}
              onCompleteMockConfirmation={onCompleteMockConfirmation}
              state={state}
            />
          );
        const screens: DialogFlowScreenRegistry<AddAddressWebFlowStep> = {
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
            content: flowContent,
            options: {
              dialogHeaderProps: { density: "expanded", title: entryLabels.title },
              hasBackButton: true,
            },
          },
          name: {
            content: flowContent,
            options: {
              dialogHeaderProps: { density: "expanded", title: entryLabels.title },
              hasBackButton: true,
            },
          },
          review: {
            content: flowContent,
            options: {
              dialogHeaderProps: { density: "expanded", title: entryLabels.title },
              hasBackButton: true,
            },
          },
          success: {
            content: flowContent,
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
            onBack={shouldUseAddAddressFlowBackNavigation(state) ? onBack : modularDialog.onBack}
            onClose={onClose}
            screens={screens}
          />
        );
      }}
    </ModularDialogFlow>
  );
}
