import React from "react";
import { StyleSheet, View, SafeAreaView, Pressable } from "react-native";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import Config from "react-native-config";
import styled, { useTheme } from "styled-components/native";

import type { DerivationMode } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import { accountsSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { TrackScreen } from "~/analytics";
import PreventNativeBack from "~/components/PreventNativeBack";
import RetryButton from "~/components/RetryButton";
import CancelButton from "~/components/CancelButton";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import NavigationScrollView from "~/components/NavigationScrollView";
import { Flex, Text, Icons } from "@ledgerhq/native-ui";

import useScanDeviceAccountsViewModel from "./useScanDeviceAccountsViewModel";
import AnimatedGradient from "./components/AnimatedGradient";
import ScanDeviceAccountsFooter from "./components/ScanDeviceAccountsFooter";
import AddressTypeTooltip from "./components/AddressTypeTooltip";
import ScannedAccountsSection from "./components/ScannedAccountsSection";
import { useRoute } from "@react-navigation/core";
import { ScanDeviceAccountsNavigationProps } from "./types";
import useAnalytics from "LLM/hooks/useAnalytics";

const StyledPressable = styled(Pressable)`
  border-width: 1px;
  border-style: dotted;
  border-color: ${({ theme }) => theme.colors.opacityDefault.c10};
  padding: 16px;
  margin-vertical: 8px;
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  column-gap: 12px;
`;

function ScanDeviceAccounts() {
  const { colors } = useTheme();

  const existingAccounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");
  const { t } = useTranslation();
  const route = useRoute<ScanDeviceAccountsNavigationProps["route"]>();
  const { context, sourceScreenName } = route.params || {};

  const { analyticsMetadata } = useAnalytics(context, sourceScreenName);

  const {
    cantCreateAccount,
    error,
    importAccounts,
    newAccountSchemes,
    noImportableAccounts,
    onAccountNameChange,
    onCancel,
    onModalHide,
    onPressAccount,
    quitFlow,
    restartSubscription,
    scannedAccounts,
    scanning,
    sections,
    selectAll,
    selectedIds,
    showAllCreatedAccounts,
    stopSubscription,
    unselectAll,
    viewAllCreatedAccounts,
    currency,
    returnToSwap,
  } = useScanDeviceAccountsViewModel({
    existingAccounts,
    blacklistedTokenIds,
    analyticsMetadata,
  });

  const pageTrackingEvent =
    sections?.length === 0
      ? analyticsMetadata.ScanDeviceAccounts?.onAccessScreen
      : analyticsMetadata.AccountsFound?.onAccessScreen;

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background.main,
        },
      ]}
    >
      <TrackScreen name={pageTrackingEvent?.eventName} {...pageTrackingEvent?.payload} />
      <PreventNativeBack />
      {scanning || !scannedAccounts.length ? (
        <Flex px={6} style={styles.headerTitle}>
          <Text
            variant="h4"
            testID="receive-header-step2-title"
            fontSize="24px"
            color="neutral.c100"
          >
            <Trans i18nKey="addAccounts.scanDeviceAccounts.scanningTitle" />
          </Text>
        </Flex>
      ) : (
        !cantCreateAccount && (
          <Flex px={6} style={styles.headerTitle}>
            <Text
              variant="h4"
              testID="receive-header-step2-title"
              fontSize="24px"
              color="neutral.c100"
            >
              <Trans i18nKey="addAccounts.scanDeviceAccounts.title" />
            </Text>
          </Flex>
        )
      )}
      {scanning ? <AnimatedGradient /> : null}
      <NavigationScrollView style={styles.inner} contentContainerStyle={styles.innerContent}>
        {sections.map(({ id, selectable, defaultSelected, data }, i) => {
          const hasMultipleSchemes =
            id === "creatable" &&
            newAccountSchemes &&
            newAccountSchemes.length > 1 &&
            data.length > 0 &&
            !scanning;
          return (
            <View key={id}>
              <ScannedAccountsSection
                defaultSelected={defaultSelected}
                key={id}
                showHint={selectable && i === 0 && !Config.DETOX}
                header={
                  data.length ? (
                    <Trans
                      values={{
                        count: data.length,
                      }}
                      i18nKey={
                        llmNetworkBasedAddAccountFlow?.enabled
                          ? `addAccounts.scanDeviceAccounts.sections.${id}.title`
                          : `addAccounts.sections.${id}.title`
                      }
                    />
                  ) : null
                }
                index={i}
                accounts={data}
                onAccountNameChange={!selectable ? undefined : onAccountNameChange}
                onPressAccount={!selectable ? undefined : onPressAccount}
                onSelectAll={!selectable || id === "creatable" ? undefined : selectAll}
                onUnselectAll={!selectable ? undefined : unselectAll}
                selectedIds={selectedIds}
                isDisabled={!selectable}
                forceSelected={id === "existing"}
                style={hasMultipleSchemes ? styles.smallMarginBottom : {}}
              />
              {hasMultipleSchemes ? (
                <View style={styles.moreAddressTypesContainer}>
                  {showAllCreatedAccounts ? (
                    currency.type === "CryptoCurrency" ? (
                      <AddressTypeTooltip
                        accountSchemes={newAccountSchemes as DerivationMode[]}
                        currency={currency}
                      />
                    ) : null
                  ) : (
                    <StyledPressable onPress={viewAllCreatedAccounts}>
                      <Text variant="large" fontWeight="semiBold">
                        {t("addAccounts.showMoreChainType")}
                      </Text>
                      <Icons.ChevronDown size="S" color="neutral.c100" />
                    </StyledPressable>
                  )}
                </View>
              ) : null}
            </View>
          );
        })}
      </NavigationScrollView>
      {!!scannedAccounts.length && (
        <ScanDeviceAccountsFooter
          isScanning={scanning}
          canRetry={
            (!scanning && noImportableAccounts && !cantCreateAccount) ||
            (!scanning && scannedAccounts.length === 0)
          }
          canDone={!scanning && cantCreateAccount && noImportableAccounts}
          onRetry={restartSubscription}
          onStop={stopSubscription}
          onDone={quitFlow}
          onContinue={importAccounts}
          isDisabled={selectedIds.length === 0}
          returnToSwap={returnToSwap}
        />
      )}
      <GenericErrorBottomModal
        error={error}
        onClose={onCancel}
        onModalHide={onModalHide}
        footerButtons={
          <>
            <CancelButton containerStyle={styles.button} onPress={onCancel} />
            <RetryButton
              containerStyle={[styles.button, styles.buttonRight]}
              onPress={restartSubscription}
            />
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
    marginTop: 50,
  },
  headerTitle: {
    marginTop: 50,
    marginBottom: 16,
  },
  inner: {
    backgroundColor: "transparent",
  },
  innerContent: {
    paddingBottom: 24,
    backgroundColor: "transparent",
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
  smallMarginBottom: {
    marginBottom: 8,
  },
  moreAddressTypesContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
});

export default ScanDeviceAccounts;
