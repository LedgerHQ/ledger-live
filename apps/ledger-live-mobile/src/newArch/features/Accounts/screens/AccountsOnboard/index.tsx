import {
  AccountOnboardStatus,
  prepareAccountsForAdding,
  useOnboardingAccountData,
  useOnboardingFlow,
} from "@ledgerhq/live-common/hooks/useOnboarding/index";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { accountsSelector } from "~/reducers/accounts";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import type { AddAccountContextType, NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import { StepContent } from "./components/StepContent";
import { getOnboardingBridge, getOnboardingConfig } from "./registry";
import { AccountsOnboardParams, DynamicStepProps, StableStepProps } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.AccountsOnboard>
>;

export default function AccountsOnboard({ navigation, route }: Props) {
  // Extract route params
  const {
    accountsToAdd: routeAccountsToAdd = [],
    currency,
    isReonboarding = false,
    accountToReonboard,
    restoreState: _restoreState,
    editedNames: routeEditedNames = {},
  } = (route.params ?? {}) as AccountsOnboardParams;

  const accountsToAdd = useMemo(() => routeAccountsToAdd, [routeAccountsToAdd]);
  const editedNames = useMemo(() => routeEditedNames, [routeEditedNames]);

  // Extract common params from parent navigator
  const commonParams = useMemo(
    () =>
      route.params as typeof route.params & {
        context?: AddAccountContextType;
        onCloseNavigation?: () => void;
        sourceScreenName?: string;
      },
    [route],
  );

  // Selectors
  const device = useSelector(lastConnectedDeviceSelector);
  const existingAccounts = useSelector(accountsSelector);
  const dispatch = useDispatch();

  // Local loading state for account addition
  const [isAddingAccounts, setIsAddingAccounts] = useState(false);

  // Get onboarding config and bridge from registry
  const onboardingConfig = getOnboardingConfig(currency);
  const onboardingBridge = getOnboardingBridge(currency);

  if (!onboardingConfig || !onboardingBridge) {
    throw new Error(`No onboarding support for currency family: ${currency.family}`);
  }

  // Use shared hooks for account data
  const { importableAccounts, creatableAccount, accountName } = useOnboardingAccountData({
    currency,
    selectedAccounts: accountsToAdd,
    editedNames,
    accountToReonboard,
    isReonboarding,
  });

  // Use shared hook for onboarding flow
  const {
    error,
    isProcessing,
    onboardingResult,
    onboardingStatus,
    stepId,
    transitionTo,
    handleOnboardAccount,
    handleRetryOnboardAccount,
  } = useOnboardingFlow({
    currency,
    deviceId: device?.deviceId || "",
    creatableAccount: creatableAccount!,
    onboardingBridge,
    onboardingConfig,
  });

  // Handle account addition and navigation to success
  const handleAddAccounts = useCallback(() => {
    setIsAddingAccounts(true);
    try {
      const { accounts, renamings } = prepareAccountsForAdding({
        selectedAccounts: accountsToAdd,
        existingAccounts,
        editedNames,
        accountToReonboard,
        isReonboarding,
        onboardingResult: onboardingResult
          ? { completedAccount: onboardingResult.completedAccount }
          : undefined,
      });

      dispatch(
        addAccountsAction({
          scannedAccounts: accounts,
          existingAccounts,
          selectedIds: accounts.map(a => a.id),
          renamings,
        }),
      );

      // Navigate to success screen
      if (commonParams.context) {
        navigation.replace(ScreenName.AddAccountsSuccess, {
          ...commonParams,
          currency,
          accountsToAdd: accounts,
        });
      } else {
        navigation.replace(ScreenName.AddAccountsSuccess, {
          currency,
          accountsToAdd: accounts,
        });
      }
    } catch (error) {
      // Reset loading state on error
      setIsAddingAccounts(false);
      throw error;
    }
  }, [
    accountsToAdd,
    existingAccounts,
    editedNames,
    accountToReonboard,
    isReonboarding,
    onboardingResult,
    dispatch,
    navigation,
    currency,
    commonParams,
  ]);

  // Auto-start onboarding when component mounts
  useEffect(() => {
    if (creatableAccount && onboardingStatus === AccountOnboardStatus.INIT) {
      handleOnboardAccount();
    }
  }, [creatableAccount, onboardingStatus, handleOnboardAccount]);

  // Handle case when no creatable accounts (all are already used)
  useEffect(() => {
    if (!creatableAccount && importableAccounts.length > 0) {
      // All accounts are already used, navigate directly to success
      const { accounts, renamings } = prepareAccountsForAdding({
        selectedAccounts: accountsToAdd,
        existingAccounts,
        editedNames,
        accountToReonboard,
        isReonboarding,
      });

      dispatch(
        addAccountsAction({
          scannedAccounts: accounts,
          existingAccounts,
          selectedIds: accounts.map(a => a.id),
          renamings,
        }),
      );

      if (commonParams.context) {
        navigation.replace(ScreenName.AddAccountsSuccess, {
          ...commonParams,
          currency,
          accountsToAdd: accounts,
        });
      } else {
        navigation.replace(ScreenName.AddAccountsSuccess, {
          currency,
          accountsToAdd: accounts,
        });
      }
    }
  }, [
    creatableAccount,
    importableAccounts,
    accountsToAdd,
    existingAccounts,
    editedNames,
    accountToReonboard,
    isReonboarding,
    dispatch,
    navigation,
    currency,
    commonParams,
  ]);

  // Prepare stable and dynamic props for components
  const stableProps = useMemo<StableStepProps>(
    () => ({
      currency,
      device: device || { deviceId: "" },
      accountName,
      editedNames,
      creatableAccount: creatableAccount!,
      importableAccounts,
      onboardingConfig,
      isReonboarding,
      onAddAccounts: handleAddAccounts,
      onOnboardAccount: handleOnboardAccount,
      onRetryOnboardAccount: handleRetryOnboardAccount,
      transitionTo,
    }),
    [
      currency,
      device,
      accountName,
      editedNames,
      creatableAccount,
      importableAccounts,
      onboardingConfig,
      isReonboarding,
      handleAddAccounts,
      handleOnboardAccount,
      handleRetryOnboardAccount,
      transitionTo,
    ],
  );

  const dynamicProps = useMemo<DynamicStepProps>(
    () => ({
      onboardingStatus,
      onboardingResult,
      isProcessing: isProcessing || isAddingAccounts,
      error,
    }),
    [onboardingStatus, onboardingResult, isProcessing, isAddingAccounts, error],
  );

  // Get footer component for current step
  const FooterComponent = onboardingConfig.footerComponents[stepId];

  // Show loading state when waiting for initial data
  if (!creatableAccount && importableAccounts.length === 0) {
    return (
      <Flex flex={1} alignItems="center" justifyContent="center">
        <InfiniteLoader size={40} />
      </Flex>
    );
  }

  return (
    <Flex
      flexDirection="column"
      alignItems="stretch"
      flex={1}
      justifyContent="space-between"
      pb={10}
    >
      <StepContent
        stepId={stepId}
        stableProps={stableProps}
        dynamicProps={dynamicProps}
        onboardingConfig={onboardingConfig}
      />
      <Flex px={6} mt={4}>
        {FooterComponent && <FooterComponent {...stableProps} {...dynamicProps} />}
      </Flex>
    </Flex>
  );
}
