import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { Box, Flex } from "@ledgerhq/react-ui";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import { LoadingOverlay } from "LLD/components/LoadingOverlay";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setDrawer } from "~/renderer/drawers/Provider";
import { userThemeSelector } from "~/renderer/reducers/settings";
import { ScrollContainer } from "../../components/ScrollContainer";
import { FOOTER_PADDING_BOTTOM_PX, FOOTER_PADDING_TOP_PX } from "../styles";
import { StepContent, StepFooter } from "./components";
import {
  getImportableAccounts,
  prepareAccountsForAdding,
  useOnboardingAccountData,
} from "./hooks/useOnboardingAccountData";
import { useOnboardingFlow } from "./hooks/useOnboardingFlow";
import { getOnboardingBridge, getOnboardingConfig } from "./registry";
import { AccountOnboardStatus, OnboardingBridge, OnboardingConfig, StepProps } from "./types";

interface AccountsOnboardProps {
  currency: CryptoCurrency;
  device: Device;
  selectedAccounts: Account[];
  existingAccounts: Account[];
  editedNames: { [accountId: string]: string };
  isReonboarding?: boolean;
  accountToReonboard?: Account;
  onComplete: (accounts: Account[]) => void;
  onAddMore: () => void;
}

export default function AccountsOnboard({
  currency,
  device,
  selectedAccounts,
  existingAccounts,
  editedNames,
  isReonboarding = false,
  accountToReonboard,
  onComplete,
  onAddMore,
}: AccountsOnboardProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentTheme = useSelector(userThemeSelector);

  const onboardingConfig = useOnboardingConfig(currency);
  const onboardingBridge = useOnboardingBridge(currency);

  const creatableAccount = useMemo(
    () =>
      isReonboarding && accountToReonboard
        ? accountToReonboard
        : selectedAccounts.find(account => !account.used),
    [selectedAccounts, isReonboarding, accountToReonboard],
  );

  invariant(device, "device is required");
  invariant(currency, "currency is required");
  invariant(creatableAccount, "creatableAccount is required");

  const {
    stepId,
    error,
    onboardingStatus,
    isProcessing,
    onboardingResult,
    handleOnboardAccount,
    handleRetryOnboardAccount,
    transitionTo,
  } = useOnboardingFlow({
    currency,
    device,
    creatableAccount,
    onboardingBridge,
    onboardingConfig,
  });

  const importableAccounts = useMemo(
    () => getImportableAccounts(selectedAccounts),
    [selectedAccounts],
  );

  const { accountName } = useOnboardingAccountData({
    selectedAccounts,
    currency,
    editedNames,
    isReonboarding,
    accountToReonboard,
  });

  const prepareAndAddAccounts = useCallback(
    (onFinish: (accounts: Account[]) => void, shouldCloseDrawer: boolean = true) => {
      const { accounts, renamings } = prepareAccountsForAdding({
        selectedAccounts,
        existingAccounts,
        editedNames,
        isReonboarding,
        accountToReonboard,
        onboardingResult,
      });

      dispatch(
        addAccountsAction({
          scannedAccounts: accounts,
          existingAccounts,
          selectedIds: accounts.map(account => account.id),
          renamings,
        }),
      );

      if (shouldCloseDrawer) {
        setDrawer();
      }
      onFinish(accounts);
    },
    [
      selectedAccounts,
      existingAccounts,
      editedNames,
      isReonboarding,
      accountToReonboard,
      onboardingResult,
      dispatch,
    ],
  );

  const handleAddMore = useCallback(() => {
    prepareAndAddAccounts(() => {
      onAddMore();
    }, false);
  }, [onAddMore, prepareAndAddAccounts]);

  const handleAddAccounts = useCallback(() => {
    prepareAndAddAccounts(onComplete, true);
  }, [onComplete, prepareAndAddAccounts]);

  const stepperProps: StepProps = useMemo(
    () => ({
      t,
      device,
      currency,
      accountName,
      editedNames,
      creatableAccount,
      importableAccounts,
      isProcessing,
      onboardingResult,
      onboardingStatus,
      error,
      isReonboarding,
      onAddAccounts: handleAddAccounts,
      onAddMore: handleAddMore,
      onOnboardAccount: handleOnboardAccount,
      onRetryOnboardAccount: handleRetryOnboardAccount,
      transitionTo,
      onboardingConfig,
    }),
    [
      t,
      device,
      currency,
      accountName,
      editedNames,
      creatableAccount,
      importableAccounts,
      isProcessing,
      onboardingResult,
      onboardingStatus,
      error,
      isReonboarding,
      handleAddAccounts,
      handleAddMore,
      handleOnboardAccount,
      handleRetryOnboardAccount,
      transitionTo,
      onboardingConfig,
    ],
  );

  return (
    <Flex flexDirection="column" height="100%">
      {onboardingStatus === AccountOnboardStatus.PREPARE ? (
        <LoadingOverlay theme={currentTheme || "dark"} />
      ) : null}
      <ScrollContainer>
        <StepContent
          stepId={stepId}
          stepperProps={stepperProps}
          onboardingConfig={onboardingConfig}
        />
      </ScrollContainer>
      <Box
        paddingBottom={FOOTER_PADDING_BOTTOM_PX}
        paddingTop={FOOTER_PADDING_TOP_PX}
        paddingX="0px"
        zIndex={1}
      >
        <StepFooter
          stepId={stepId}
          stepperProps={stepperProps}
          onboardingConfig={onboardingConfig}
        />
      </Box>
    </Flex>
  );
}

export function useOnboardingConfig(currency: CryptoCurrency): OnboardingConfig {
  return useMemo(() => {
    const config = getOnboardingConfig(currency);
    if (!config) {
      throw new Error(`No onboarding config found for currency family: ${currency.family}`);
    }
    return config;
  }, [currency]);
}

export function useOnboardingBridge(currency: CryptoCurrency): OnboardingBridge {
  return useMemo(() => {
    const bridge = getOnboardingBridge(currency);
    if (!bridge) {
      throw new Error(`No onboarding bridge found for currency family: ${currency.family}`);
    }
    return bridge;
  }, [currency]);
}
