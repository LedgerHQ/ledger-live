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
  prepareAccountsForAdding,
  useOnboardingAccountData,
} from "./hooks/useOnboardingAccountData";
import { useOnboardingFlow } from "./hooks/useOnboardingFlow";
import { getOnboardingBridge, getOnboardingConfig } from "./registry";
import {
  AccountOnboardStatus,
  DynamicStepProps,
  OnboardingBridge,
  OnboardingConfig,
  StableStepProps,
} from "./types";

interface AccountsOnboardProps {
  currency: CryptoCurrency;
  device: Device;
  selectedAccounts: Account[];
  existingAccounts: Account[];
  editedNames: { [accountId: string]: string };
  accountToReonboard?: Account;
  isReonboarding?: boolean;
  onComplete: (accounts: Account[]) => void;
}

export default function AccountsOnboard({
  currency,
  device,
  selectedAccounts,
  existingAccounts,
  editedNames,
  accountToReonboard,
  isReonboarding = false,
  onComplete,
}: AccountsOnboardProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentTheme = useSelector(userThemeSelector);

  const onboardingConfig = useOnboardingConfig(currency);
  const onboardingBridge = useOnboardingBridge(currency);

  const { importableAccounts, creatableAccount, accountName } = useOnboardingAccountData({
    currency,
    selectedAccounts,
    editedNames,
    accountToReonboard,
    isReonboarding,
  });

  invariant(device, "device is required");
  invariant(currency, "currency is required");
  invariant(creatableAccount, "creatableAccount is required");

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
    device,
    creatableAccount,
    onboardingConfig,
    onboardingBridge,
  });

  const prepareAndAddAccounts = useCallback(
    (onFinish: (accounts: Account[]) => void, shouldCloseDrawer: boolean = true) => {
      const { accounts, renamings } = prepareAccountsForAdding({
        selectedAccounts,
        existingAccounts,
        editedNames,
        accountToReonboard,
        isReonboarding,
        onboardingResult,
      });

      dispatch(
        addAccountsAction({
          existingAccounts,
          renamings,
          scannedAccounts: accounts,
          selectedIds: accounts.map(account => account.id),
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
      accountToReonboard,
      isReonboarding,
      onboardingResult,
      dispatch,
    ],
  );

  const handleAddAccounts = useCallback(() => {
    prepareAndAddAccounts(onComplete, true);
  }, [onComplete, prepareAndAddAccounts]);

  const stableProps = useMemo<StableStepProps>(
    () => ({
      currency,
      device,
      t,
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
    }),
    [
      currency,
      device,
      t,
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
      isProcessing,
      error,
    }),
    [onboardingStatus, onboardingResult, isProcessing, error],
  );

  return (
    <Flex flexDirection="column" height="100%">
      {onboardingStatus === AccountOnboardStatus.PREPARE ? (
        <LoadingOverlay theme={currentTheme || "dark"} />
      ) : null}
      <ScrollContainer>
        <StepContent
          stepId={stepId}
          stableProps={stableProps}
          dynamicProps={dynamicProps}
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
          stableProps={stableProps}
          dynamicProps={dynamicProps}
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
