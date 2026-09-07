import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ContactsFeatureIntroductionSheet } from "LLM/features/Contacts/screens/ContactsPage/components/ContactsFeatureIntroductionSheet";
import { SendFlowLayout } from "LLM/features/Send/components/SendFlowLayout";
import { MemoControls } from "LLM/features/Send/components/Memo/MemoControls";
import React from "react";
import { KeyboardAvoidingView, ScrollView } from "react-native";
import type { RecipientScreenContentViewModel } from "../hooks/useRecipientScreenContentViewModel";
import { AddressMatchedSection } from "./AddressMatchedSection";
import { AddressValidationError } from "./AddressValidationError";
import { LoadingState } from "./LoadingState";
import { PasteFromClipboard } from "./PasteFromClipboard";
import { ContactAddressPicker } from "@features/flow-pay-contact";
import { RecipientContactsList } from "./RecipientContactsList";
import { RecipientEmptyContactsState } from "./RecipientEmptyContactsState";
import { ValidationBanner } from "./ValidationBanner";

type RecipientScreenViewProps = Readonly<{
  viewModel: RecipientScreenContentViewModel;
}>;

export const RecipientScreenView = ({ viewModel }: RecipientScreenViewProps) => {
  const {
    recipient,
    memo,
    showMemo,
    showMatched,
    shouldShowErrorBanner,
    keyboardBehavior,
    addressMatchedSectionViewModel,
  } = viewModel;
  const {
    isLoading,
    showInitialState,
    showContactsList,
    showContactSearchResult,
    showEmptyContactsState,
    contactsOnNetwork,
    contactSearchResult,
    handleContactSelect,
    contactAddressPicker,
    showBridgeSenderError,
    bridgeSenderError,
    showSanctionedBanner,
    showBridgeRecipientError,
    showBridgeRecipientWarning,
    showAddressValidationError,
    bridgeRecipientError,
    bridgeRecipientWarning,
    addressValidationErrorType,
    clipboardAddress,
    handlePasteFromClipboard,
    featureIntroduction,
  } = recipient;

  return (
    <SendFlowLayout>
      <ContactsFeatureIntroductionSheet {...featureIntroduction} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardBehavior}>
        <ScrollView
          style={{ flex: 1, marginHorizontal: -8 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {isLoading && !showMatched && <LoadingState />}

          {showInitialState && clipboardAddress && (
            <PasteFromClipboard address={clipboardAddress} onPaste={handlePasteFromClipboard} />
          )}

          {showInitialState && showEmptyContactsState && <RecipientEmptyContactsState />}

          {showInitialState && showContactsList && (
            <RecipientContactsList
              contacts={contactsOnNetwork}
              onContactSelect={handleContactSelect}
            />
          )}

          {showContactSearchResult && contactSearchResult && (
            <RecipientContactsList
              contacts={[contactSearchResult]}
              onContactSelect={handleContactSelect}
            />
          )}

          {showMemo && <MemoControls vm={memo} />}

          {showMatched && <AddressMatchedSection viewModel={addressMatchedSectionViewModel} />}

          {showAddressValidationError && (
            <AddressValidationError error={addressValidationErrorType} />
          )}

          {shouldShowErrorBanner && (
            <Box lx={{ marginHorizontal: "s8", gap: "s16" }}>
              {showBridgeSenderError && (
                <ValidationBanner type="error" error={bridgeSenderError} variant="sender" />
              )}
              {showSanctionedBanner && <ValidationBanner type="sanctioned" />}
              {showBridgeRecipientError && (
                <ValidationBanner
                  type="error"
                  error={bridgeRecipientError}
                  variant="recipient"
                  excludeRecipientRequired
                />
              )}
              {showBridgeRecipientWarning && (
                <ValidationBanner
                  type="warning"
                  warning={bridgeRecipientWarning}
                  variant="recipient"
                />
              )}
            </Box>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <ContactAddressPicker {...contactAddressPicker} />
    </SendFlowLayout>
  );
};
