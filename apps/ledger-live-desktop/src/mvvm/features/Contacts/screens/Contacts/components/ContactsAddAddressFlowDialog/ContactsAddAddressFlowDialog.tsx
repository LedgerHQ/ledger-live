import React, { useCallback } from "react";
import { Button, Link } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import { useLocalizedUrl, useOpenLink } from "@shared/linking";
import { DialogFlow, type DialogFlowScreenRegistry } from "LLD/components/DialogFlow";
import { ModularDialogFlow } from "LLD/features/ModularDialog/ModularDialogFlow";
import {
  ContactsAddAddressFlowContent,
  resolveAddAddressWebFlowStep,
  shouldUseAddAddressFlowBackNavigation,
  type AddAddressWebFlowStep,
  urls as contactsUrls,
} from "@features/flow-contacts-add-address";
import type { ContactsAddAddressFlowDialogProps } from "./types";

export function ContactsAddAddressFlowDialog({
  state,
  entryLabels,
  privacyLink,
  sanctionedAddressBanner,
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
  const openLink = useOpenLink();
  const localizedPrivacyPolicyUrl = useLocalizedUrl(contactsUrls.privacyPolicy.desktop);
  const handlePressPrivacyPolicy = useCallback(() => {
    if (privacyLink) openLink(localizedPrivacyPolicyUrl);
  }, [openLink, privacyLink, localizedPrivacyPolicyUrl]);

  if (state.status === "closed") {
    return null;
  }

  const isSelectingCurrency = state.status === "selectingCurrency";
  const isConfirmEnabled =
    state.status === "enteringAddress" &&
    state.addressEntry.status === "valid" &&
    state.addressLabel.status === "valid";
  const footer = (
    <div className="flex flex-col items-center w-full pb-24">
      <Button
        appearance="base"
        className="w-full"
        data-testid="contacts-add-address-confirm"
        disabled={!isConfirmEnabled}
        icon={LedgerLogo}
        onClick={onContinueFromAddressDetails}
        size="lg"
      >
        {entryLabels.confirmAddress}
      </Button>
      {privacyLink ? (
        <Link
          appearance="base"
          className="cursor-pointer mt-24"
          data-testid="contacts-add-address-privacy-policy"
          underline={false}
          isExternal
          size="sm"
          onClick={handlePressPrivacyPolicy}
        >
          {privacyLink.label}
        </Link>
      ) : null}
    </div>
  );

  return (
    <ModularDialogFlow fillAvailableHeight={isSelectingCurrency} onClose={onClose}>
      {modularDialog => {
        const currentStep = resolveAddAddressWebFlowStep(state);
        const flowContent =
          state.status === "selectingCurrency" ? (
            modularDialog.content
          ) : (
            <ContactsAddAddressFlowContent
              entryLabels={entryLabels}
              sanctionedAddressBanner={sanctionedAddressBanner}
              nameLabels={nameLabels}
              reviewLabels={reviewLabels}
              onAddressChange={onAddressChange}
              onAddressLabelChange={onAddressLabelChange}
              onContinueFromAddressDetails={onContinueFromAddressDetails}
              onContinueFromName={onContinueFromName}
              onContinueFromReview={onContinueFromReview}
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
              dialogFooter: footer,
              dialogFooterClassName:
                "bg-gradient-to-b from-canvas-sheet-transparent to-canvas-sheet",
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
              dialogBodyProps: {
                className: `!mb-0 ${isSelectingCurrency ? "px-16 pb-0" : "px-24 pb-24"} pt-12`,
              },
              dialogContentProps: { className: "w-400 bg-canvas-sheet pb-0" },
            }}
            height={isSelectingCurrency ? "fixed" : undefined}
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
