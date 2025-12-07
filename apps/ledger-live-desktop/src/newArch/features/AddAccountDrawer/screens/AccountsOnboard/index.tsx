import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { Box, Flex, Text } from "@ledgerhq/react-ui";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import { LoadingOverlay } from "LLD/components/LoadingOverlay";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { setDrawer } from "~/renderer/drawers/Provider";
import logger from "~/renderer/logger";
import { userThemeSelector } from "~/renderer/reducers/settings";
import { ScrollContainer } from "../../components/ScrollContainer";
import { FOOTER_PADDING_BOTTOM_PX, FOOTER_PADDING_TOP_PX } from "../styles";
import {
  getImportableAccounts,
  prepareAccountsForAdding,
  useAccountPreparation,
} from "./hooks/useAccountPreparation";
import { useOnboardingFlow } from "./hooks/useOnboardingFlow";
import { getOnboardingBridge, getOnboardingConfig } from "./registry";
import { AccountOnboardStatus, StepProps } from "./types";

interface AccountsOnboardProps {
  currency: CryptoCurrency;
  device: Device;
  selectedAccounts: Account[];
  existingAccounts: Account[];
  editedNames: { [accountId: string]: string };
  isReonboarding?: boolean;
  accountToReonboard?: Account;
  onComplete: (accounts: Account[]) => void;
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
}: AccountsOnboardProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentTheme = useSelector(userThemeSelector);

  // Get onboarding config and bridge
  const onboardingConfig = (() => {
    const config = getOnboardingConfig(currency);
    invariant(config, `No onboarding config found for currency family: ${currency.family}`);
    return config;
  })();

  const onboardingBridge = (() => {
    const bridge = getOnboardingBridge(currency);
    invariant(bridge, `No onboarding bridge found for currency family: ${currency.family}`);
    return bridge;
  })();

  // Calculate creatableAccount first (before hooks that depend on it)
  const creatableAccount = useMemo(
    () =>
      isReonboarding && accountToReonboard
        ? accountToReonboard
        : selectedAccounts.find(account => !account.used),
    [selectedAccounts, isReonboarding, accountToReonboard],
  );

  // Validate required props early
  invariant(device, "device is required");
  invariant(currency, "currency is required");
  invariant(creatableAccount, "creatableAccount is required");

  // Use onboarding flow hook
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

  // Calculate importable accounts
  const importableAccounts = useMemo(
    () => getImportableAccounts(selectedAccounts),
    [selectedAccounts],
  );

  // Use account preparation hook with onboarding result for account name resolution
  const { accountName } = useAccountPreparation({
    selectedAccounts,
    currency,
    editedNames,
    isReonboarding,
    accountToReonboard,
    onboardingResult,
  });

  const handleAddMore = useCallback(() => {
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

    setDrawer();
    dispatch(
      openModal("MODAL_ADD_ACCOUNTS", {
        currency,
      }),
    );
  }, [
    currency,
    dispatch,
    selectedAccounts,
    existingAccounts,
    editedNames,
    isReonboarding,
    accountToReonboard,
    onboardingResult,
  ]);

  const handleAddAccounts = useCallback(() => {
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

    setDrawer();
    onComplete(accounts);
  }, [
    selectedAccounts,
    existingAccounts,
    editedNames,
    isReonboarding,
    accountToReonboard,
    onboardingResult,
    dispatch,
    onComplete,
  ]);

  const stepperProps: StepProps = {
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
  };

  const renderStepContent = () => {
    const StepComponent = onboardingConfig.stepComponents[stepId];
    if (!StepComponent) {
      const errorMessage = `No step component found for stepId: ${stepId}. Available steps: ${Object.keys(onboardingConfig.stepComponents).join(", ")}`;
      logger.error(`[renderStepContent] ${errorMessage}`);
      return (
        <Box p={4}>
          <Text variant="body" color="error.c100">
            {t("error.componentNotFound", { defaultValue: "An error occurred. Please try again." })}
          </Text>
        </Box>
      );
    }
    try {
      return <StepComponent {...stepperProps} />;
    } catch (err) {
      logger.error(`[renderStepContent] Error rendering step component for ${stepId}`, err);
      return (
        <Box p={4}>
          <Text variant="body" color="error.c100">
            {t("error.renderingFailed", {
              defaultValue: "Failed to render component. Please try again.",
            })}
          </Text>
        </Box>
      );
    }
  };

  const renderFooter = () => {
    const FooterComponent = onboardingConfig.footerComponents[stepId];
    if (!FooterComponent) {
      const errorMessage = `No footer component found for stepId: ${stepId}. Available footers: ${Object.keys(onboardingConfig.footerComponents).join(", ")}`;
      logger.error(`[renderFooter] ${errorMessage}`);
      // Return empty footer instead of null to maintain layout
      return null;
    }
    try {
      return <FooterComponent {...stepperProps} />;
    } catch (err) {
      logger.error(`[renderFooter] Error rendering footer component for ${stepId}`, err);
      // Return empty footer on error to maintain layout
      return null;
    }
  };

  return (
    <Flex flexDirection="column" height="100%">
      {onboardingStatus === AccountOnboardStatus.PREPARE ? (
        <LoadingOverlay theme={currentTheme || "dark"} />
      ) : null}
      <ScrollContainer>{renderStepContent()}</ScrollContainer>
      <Box
        paddingBottom={FOOTER_PADDING_BOTTOM_PX}
        paddingTop={FOOTER_PADDING_TOP_PX}
        paddingX="0px"
        zIndex={1}
      >
        {renderFooter()}
      </Box>
    </Flex>
  );
}
