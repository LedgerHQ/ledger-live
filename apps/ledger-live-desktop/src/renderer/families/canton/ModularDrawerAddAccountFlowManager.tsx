import { AnimatePresence } from "framer-motion";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import styled from "styled-components";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { isCantonAccount } from "@ledgerhq/coin-canton/bridge/serialization";
import { Flex } from "@ledgerhq/react-ui/index";
import type { Account } from "@ledgerhq/types-live";
import { type ModularDrawerAddAccountStep } from "LLD/features/AddAccountDrawer/domain";
import { MODULAR_DIALOG_PAGE_NAME } from "LLD/features/ModularDialog/analytics/modularDialog.types";
import AnimatedScreenWrapper from "LLD/features/AddAccountDrawer/components/AnimatedScreenWrapper";
import { BackButtonArrow } from "LLD/features/AddAccountDrawer/components/BackButton";
import { AccountSelection } from "LLD/features/AddAccountDrawer/screens/AccountSelection";
import HeaderGradient from "LLD/features/AddAccountDrawer/components/HeaderGradient";
import AccountsAdded from "LLD/features/AddAccountDrawer/screens/AccountsAdded";
import AccountsWarning from "LLD/features/AddAccountDrawer/screens/AccountsWarning";
import ConnectYourDevice from "LLD/features/AddAccountDrawer/screens/ConnectYourDevice";
import EditAccountName from "LLD/features/AddAccountDrawer/screens/EditAccountName";
import FundAccount from "LLD/features/AddAccountDrawer/screens/FundAccount";
import ScanAccounts from "LLD/features/AddAccountDrawer/screens/ScanAccounts";
import { ADD_ACCOUNT_FLOW_NAME } from "LLD/features/AddAccountDrawer/analytics/addAccount.types";
import {
  ANALYTICS_PROPERTY_FLOW,
  Title,
  type ModularDrawerAddAccountFlowManagerProps,
} from "LLD/features/AddAccountDrawer/ModularDrawerAddAccountFlowManager";
import { setFlowValue } from "~/renderer/reducers/modularDialog";
import { CANTON_MODULAR_DRAWER_ADD_ACCOUNT_STEP } from "./AddAccountDrawer/domain";
import type { CantonModularDrawerAddAccountStep } from "./AddAccountDrawer/domain";
import { useAddAccountFlowNavigation } from "./AddAccountDrawer/hooks/useAddAccountFlowNavigation";
import CantonOnboard from "./AddAccountDrawer/CantonOnboard";
import CantonDisclaimer from "./AddAccountDrawer/CantonDisclaimer";

const StepContainer = styled(Flex)`
  flex: 1;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const ModularDrawerAddAccountFlowManager = ({
  currency,
  onAccountSelected,
}: ModularDrawerAddAccountFlowManagerProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [connectAppResult, setConnectAppResult] = useState<AppResult>();
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);
  const [cantonAccountsToOnboard, setCantonAccountsToOnboard] = useState<Account[]>([]);

  const {
    currentStep,
    navigationDirection,
    warningReason,
    emptyAccount,
    accountToEdit,
    accountToFund,
    closeDrawer,
    navigateBack,
    navigateToCantonOnboard,
    navigateToWarningScreen,
    navigateToEditAccountName,
    navigateToFundAccount,
    navigateToSelectAccount,
    navigateToScanAccounts,
    navigateToConnectDevice,
    navigateToAccountsAdded,
  } = useAddAccountFlowNavigation({
    selectedAccounts,
    onAccountSelected,
    originalCurrency: currency,
  });

  const isAccountSelectionFlow = !!onAccountSelected;
  const cryptoCurrency =
    currency.type === "CryptoCurrency"
      ? currency
      : getCryptoCurrencyById(currency.parentCurrencyId);

  const handleConnect = useCallback(
    (result: AppResult) => {
      setConnectAppResult(result);
      navigateToScanAccounts();
    },
    [navigateToScanAccounts],
  );

  const handleScanComplete = useCallback(
    (accounts: Account[]) => {
      // Check if any accounts need Canton onboarding
      const needsOnboarding = accounts.filter(
        account => isCantonAccount(account) && !account.cantonResources.isOnboarded,
      );

      if (needsOnboarding.length > 0) {
        setCantonAccountsToOnboard(accounts);
        navigateToCantonOnboard();
      } else {
        setSelectedAccounts(accounts);
        navigateToAccountsAdded();
      }
    },
    [navigateToCantonOnboard, navigateToAccountsAdded],
  );

  const handleOnboardComplete = useCallback(
    (accounts: Account[]) => {
      setSelectedAccounts(accounts);
      navigateToAccountsAdded();
    },
    [navigateToAccountsAdded],
  );

  const renderStepContent = (step: CantonModularDrawerAddAccountStep) => {
    switch (step) {
      case CANTON_MODULAR_DRAWER_ADD_ACCOUNT_STEP.DISCLAIMER:
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <CantonDisclaimer onAgree={navigateToConnectDevice} onCancel={closeDrawer} />
          </StepContainer>
        );
      case CANTON_MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE:
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <ConnectYourDevice
              currency={cryptoCurrency}
              onConnect={handleConnect}
              analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW}
            />
          </StepContainer>
        );
      case CANTON_MODULAR_DRAWER_ADD_ACCOUNT_STEP.SCAN_ACCOUNTS:
        if (!connectAppResult) {
          throw new Error("Missing 'connectAppResult'");
        }
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <ScanAccounts
              currency={cryptoCurrency}
              deviceId={connectAppResult.device.deviceId}
              onRetry={navigateToConnectDevice}
              onComplete={handleScanComplete}
              analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW}
              navigateToWarningScreen={navigateToWarningScreen}
              deferAccountAddition
            />
          </StepContainer>
        );
      case CANTON_MODULAR_DRAWER_ADD_ACCOUNT_STEP.CANTON_ONBOARD:
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <CantonOnboard
              currency={cryptoCurrency}
              selectedAccounts={cantonAccountsToOnboard}
              onComplete={handleOnboardComplete}
            />
          </StepContainer>
        );
      case CANTON_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED:
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <AccountsAdded
              accounts={selectedAccounts}
              navigateToEditAccountName={navigateToEditAccountName}
              navigateToFundAccount={navigateToFundAccount}
              navigateToSelectAccount={navigateToSelectAccount}
              isAccountSelectionFlow={isAccountSelectionFlow}
            />
          </StepContainer>
        );
      case CANTON_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING:
        if (!warningReason) {
          throw new Error("Missing 'warningReason'");
        }
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <AccountsWarning
              warningReason={warningReason}
              currency={cryptoCurrency}
              emptyAccount={emptyAccount}
              navigateToEditAccountName={navigateToEditAccountName}
              navigateToFundAccount={navigateToFundAccount}
              isAccountSelectionFlow={isAccountSelectionFlow}
            />
          </StepContainer>
        );
      case CANTON_MODULAR_DRAWER_ADD_ACCOUNT_STEP.EDIT_ACCOUNT_NAME:
        if (!accountToEdit) {
          throw new Error("Missing 'accountToEdit'");
        }
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <EditAccountName account={accountToEdit} navigateBack={navigateBack} />
          </StepContainer>
        );
      case CANTON_MODULAR_DRAWER_ADD_ACCOUNT_STEP.FUND_ACCOUNT:
        if (!accountToFund) {
          throw new Error("Missing 'accountToFund'");
        }
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <FundAccount account={accountToFund} currency={cryptoCurrency} />
          </StepContainer>
        );
      case CANTON_MODULAR_DRAWER_ADD_ACCOUNT_STEP.SELECT_ACCOUNT:
        dispatch(setFlowValue(ADD_ACCOUNT_FLOW_NAME));
        return (
          <StepContainer data-test-id="content">
            <Title>
              {onAccountSelected
                ? t("modularAssetDrawer.addAccounts.addAccountSelectionPtxFlow")
                : t("modularAssetDrawer.addAccounts.addAccountSelection")}
            </Title>
            <AccountSelection
              asset={cryptoCurrency}
              overridePageName={MODULAR_DIALOG_PAGE_NAME.FUND_ACCOUNT_LIST}
              onAccountSelected={accountToFund => navigateToFundAccount(accountToFund as Account)}
              hideAddAccountButton
            />
          </StepContainer>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence
      initial={false}
      custom={navigationDirection}
      mode="sync"
      data-test-id="add-account-animated"
    >
      <HeaderGradient
        currentStep={currentStep as ModularDrawerAddAccountStep}
        warningReason={warningReason}
        data-test-id="header-gradient"
      />
      {navigateBack && <BackButtonArrow onBackClick={navigateBack} />}
      <AnimatedScreenWrapper
        key={currentStep}
        screenKey={currentStep as ModularDrawerAddAccountStep}
        direction={navigationDirection}
      >
        {renderStepContent(currentStep)}
      </AnimatedScreenWrapper>
    </AnimatePresence>
  );
};

export default ModularDrawerAddAccountFlowManager;
