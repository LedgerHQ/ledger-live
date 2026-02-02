import React from "react";
import { View, ScrollView } from "react-native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { PasteCard } from "./components/PasteCard";
import { RecentAddressesSection } from "./components/RecentAddressesSection";
import { MyAccountsSection } from "./components/MyAccountsSection";
import { AddressMatchedSection } from "./components/AddressMatchedSection";
import { ErrorState } from "./components/ErrorState";
import { EmptyState } from "./components/EmptyState";
import { LoadingState } from "./components/LoadingState";
import { ValidationBanner } from "./components/ValidationBanner";
import type { RecipientScreenViewProps } from "./types";

export function RecipientScreenView({
  searchValue,
  isLoading,
  result,
  recentAddresses,
  mainAccount,
  currency,
  clipboardAddress,
  showInitialState,
  showInitialEmptyState,
  showMatchedAddress,
  showAddressValidationError,
  showEmptyState,
  showBridgeSenderError,
  showSanctionedBanner,
  showBridgeRecipientError,
  showBridgeRecipientWarning,
  isSanctioned,
  isAddressComplete,
  addressValidationErrorType,
  bridgeRecipientError,
  bridgeRecipientWarning,
  bridgeSenderError,
  onPasteFromClipboard,
  onRecentAddressSelect,
  onAccountSelect,
  onAddressSelect,
  onRemoveAddress,
}: RecipientScreenViewProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        gap: theme.spacings.s16,
      },
      pasteSection: {
        paddingHorizontal: theme.spacings.s8,
      },
      scrollView: {
        flex: 1,
      },
      scrollContent: {
        flexGrow: 1,
        gap: theme.spacings.s8,
      },
      bannerContainer: {
        marginTop: theme.spacings.s24,
        gap: theme.spacings.s16,
        paddingHorizontal: theme.spacings.s8,
      },
    }),
    [],
  );

  const shouldShowErrorBanner =
    !isLoading &&
    (showBridgeSenderError ||
      showSanctionedBanner ||
      showBridgeRecipientError ||
      showBridgeRecipientWarning);

  return (
    <View style={styles.container}>
      {/* Paste Section - shown when clipboard has address and no search */}
      {clipboardAddress && !searchValue && (
        <View style={styles.pasteSection}>
          <PasteCard clipboardAddress={clipboardAddress} onPaste={onPasteFromClipboard} />
        </View>
      )}

      {/* Content Section */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoading && <LoadingState />}

        {showInitialState && !isLoading && (
          <>
            <RecentAddressesSection
              recentAddresses={recentAddresses}
              onSelect={onRecentAddressSelect}
              onRemove={onRemoveAddress}
            />
            <MyAccountsSection
              currency={currency}
              currentAccountId={mainAccount.id}
              onSelect={onAccountSelect}
            />
          </>
        )}

        {showMatchedAddress && !isLoading && (
          <AddressMatchedSection
            searchResult={result}
            searchValue={searchValue}
            onSelect={onAddressSelect}
            isSanctioned={isSanctioned}
            isAddressComplete={isAddressComplete}
            hasBridgeError={showBridgeRecipientError || showBridgeRecipientWarning}
          />
        )}

        {showAddressValidationError && !isLoading && (
          <ErrorState errorType={addressValidationErrorType} />
        )}

        {(showEmptyState || showInitialEmptyState) && !isLoading && <EmptyState />}

        {shouldShowErrorBanner && (
          <View style={styles.bannerContainer}>
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
          </View>
        )}
      </ScrollView>
    </View>
  );
}
