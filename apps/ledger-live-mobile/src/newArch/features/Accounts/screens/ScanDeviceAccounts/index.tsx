import React, { memo } from "react";
import { StyleSheet, View, SafeAreaView } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import Config from "react-native-config";
import { useTheme } from "styled-components/native";

import type { Account, DerivationMode } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import { accountsSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { Theme, withTheme } from "../../../../../colors";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

import Button from "~/components/Button";
import PreventNativeBack from "~/components/PreventNativeBack";
import Chevron from "~/icons/Chevron";
import LText from "~/components/LText";
import RetryButton from "~/components/RetryButton";
import CancelButton from "~/components/CancelButton";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import NavigationScrollView from "~/components/NavigationScrollView";
import { Flex, Text } from "@ledgerhq/native-ui";

import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import useScanDeviceAccountsViewModel from "./useScanDeviceAccountsViewModel";
import AnimatedGradient from "./components/AnimatedGradient";
import ScanDeviceAccountsFooter from "./components/ScanDeviceAccountsFooter";
import AddressTypeTooltip from "./components/AddressTypeTooltip";
import ScannedAccountsSection from "./components/ScannedAccountsSection";

type NavigationProps = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.ScanDeviceAccounts>
>;
type Props = {
  existingAccounts: Account[];
  blacklistedTokenIds?: string[];
  colors: Theme["colors"];
} & NavigationProps;

function ScanDeviceAccounts() {
  const { colors } = useTheme();

  const existingAccounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");

  const {
    alreadyEmptyAccount,
    alreadyEmptyAccountName,
    cantCreateAccount,
    CustomNoAssociatedAccounts,
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
  });

  // Empty state same UI as ledger-live-mobile/src/screens/AddAccounts/03-Accounts.tsx
  const emptyTexts = {
    creatable: alreadyEmptyAccount ? (
      <LText style={styles.paddingHorizontal}>
        <Trans i18nKey="addAccounts.cantCreateAccount">
          {"PLACEHOLDER-1"}
          <LText semiBold>{alreadyEmptyAccountName}</LText>
          {"PLACEHOLDER-2"}
        </Trans>
      </LText>
    ) : CustomNoAssociatedAccounts ? (
      <CustomNoAssociatedAccounts style={styles} />
    ) : (
      <LText style={styles.paddingHorizontal}>
        <Trans i18nKey="addAccounts.noAccountToCreate">
          {"PLACEHOLDER-1"}
          <LText semiBold>{currency.name}</LText>
          {"PLACEHOLDER-2"}
        </Trans>
      </LText>
    ),
  };

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background.main,
        },
      ]}
    >
      <TrackScreen category="AddAccounts" name="Accounts" currencyName={currency.name} />
      <PreventNativeBack />
      <Flex px={6}>
        {scanning || !scannedAccounts.length ? (
          <Text
            variant="h4"
            testID="receive-header-step2-title"
            fontSize="24px"
            color="neutral.c100"
          >
            <Trans i18nKey="addAccounts.scanDeviceAccounts.scanningTitle" />
          </Text>
        ) : (
          <Text
            variant="h4"
            testID="receive-header-step2-title"
            fontSize="24px"
            color="neutral.c100"
          >
            <Trans i18nKey="addAccounts.scanDeviceAccounts.title" />
          </Text>
        )}
      </Flex>

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
                        length: data.length,
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
                emptyState={emptyTexts[id as keyof typeof emptyTexts]}
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
                    <Button
                      event={"AddAccountsMoreAddressType"}
                      type="secondary"
                      title={<Trans i18nKey="addAccounts.showMoreChainType" />}
                      onPress={viewAllCreatedAccounts}
                      IconRight={Chevron}
                    />
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
  },
  paddingHorizontal: {
    paddingHorizontal: 16,
  },
  inner: {
    paddingTop: 24,
    backgroundColor: "transparent",
  },
  innerContent: {
    paddingBottom: 24,
    backgroundColor: "transparent",
  },
  descText: {
    paddingHorizontal: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  addAccountsError: {
    marginHorizontal: 16,
    marginBottom: 16,
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

export default withTheme(memo<Props>(ScanDeviceAccounts));
