import {
  AccountOnboardStatus,
  prepareAccountsForAdding,
  useOnboardingAccountData,
  useOnboardingFlow,
} from "@ledgerhq/live-common/hooks/useAccountOnboarding";
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

  const commonParams = useMemo(
    () =>
      route.params as typeof route.params & {
        context?: AddAccountContextType;
        onCloseNavigation?: () => void;
        sourceScreenName?: string;
      },
    [route],
  );

  const device = useSelector(lastConnectedDeviceSelector);
  const existingAccounts = useSelector(accountsSelector);
  const dispatch = useDispatch();

  const [isAddingAccounts, setIsAddingAccounts] = useState(false);

  const onboardingConfig = getOnboardingConfig(currency);
  const onboardingBridge = getOnboardingBridge(currency);

  if (!onboardingConfig || !onboardingBridge) {
    throw new Error(`No onboarding support for currency family: ${currency.family}`);
  }

  const { importableAccounts, creatableAccount, accountName } = useOnboardingAccountData({
    currency,
    selectedAccounts: accountsToAdd,
    editedNames,
    accountToReonboard,
    isReonboarding,
  });

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
    // Non-null assertion is safe here because:
    // The hook's methods (handleOnboardAccount) are only called when creatableAccount exists
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    creatableAccount: creatableAccount!,
    currency,
    deviceId: device?.deviceId || "",
    onboardingBridge,
    onboardingConfig,
  });

  const handleAddAccountsDirectly = useCallback(
    (includeOnboardingResult: boolean = false) => {
      const { accounts, renamings } = prepareAccountsForAdding({
        selectedAccounts: accountsToAdd,
        existingAccounts,
        editedNames,
        accountToReonboard,
        isReonboarding,
        onboardingResult:
          includeOnboardingResult && onboardingResult
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
    },
    [
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
    ],
  );

  const handleAddAccounts = useCallback(() => {
    setIsAddingAccounts(true);
    try {
      handleAddAccountsDirectly(true);
    } catch (error) {
      setIsAddingAccounts(false);
      throw error;
    }
  }, [handleAddAccountsDirectly]);

  useEffect(() => {
    if (creatableAccount && onboardingStatus === AccountOnboardStatus.INIT) {
      handleOnboardAccount();
    }
  }, [creatableAccount, onboardingStatus, handleOnboardAccount]);

  // Handle case when no creatable accounts (all are already used)
  useEffect(() => {
    if (!creatableAccount && importableAccounts.length > 0) {
      // All accounts are already used, navigate directly to success
      handleAddAccountsDirectly(false);
    }
  }, [creatableAccount, importableAccounts.length, handleAddAccountsDirectly]);

  const stableProps = useMemo<StableStepProps>(() => {
    // At this point, creatableAccount is should not to be null :
    if (!creatableAccount) {
      throw new Error("creatableAccount is required but was null");
    }
    return {
      currency,
      device: device || { deviceId: "" },
      accountName,
      editedNames,
      creatableAccount,
      importableAccounts,
      onboardingConfig,
      isReonboarding,
      onAddAccounts: handleAddAccounts,
      onOnboardAccount: handleOnboardAccount,
      onRetryOnboardAccount: handleRetryOnboardAccount,
      transitionTo,
    };
  }, [
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
  ]);

  const dynamicProps = useMemo<DynamicStepProps>(
    () => ({
      onboardingStatus,
      onboardingResult,
      isProcessing: isProcessing || isAddingAccounts,
      error,
    }),
    [onboardingStatus, onboardingResult, isProcessing, isAddingAccounts, error],
  );

  const FooterComponent = onboardingConfig.footerComponents[stepId];

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
