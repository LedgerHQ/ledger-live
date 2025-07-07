import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { Flex } from "@ledgerhq/react-ui/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AnimatePresence } from "framer-motion";
import React, { useCallback, useState } from "react";
import ConnectYourDevice from "./screens/ConnectYourDevice";
import ScanAccounts from "./screens/ScanAccounts";
import { MODULAR_DRAWER_ADD_ACCOUNT_STEP, ModularDrawerAddAccountStep } from "./types";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { BackButtonArrow } from "./components/BackButton";
import { Account } from "@ledgerhq/types-live";
import AccountsAdded from "./screens/AccountsAdded";
import HeaderGradient from "./components/HeaderGradient";
import AccountsWarning from "./screens/AccountsWarning";
import FundAccount from "./screens/FundAccount";
import { AccountSelection } from "./screens/AccountSelection";
import { useAddAccountFlowNavigation } from "./hooks/useAddAccountFlowNavigation";
import { ADD_ACCOUNT_FLOW_NAME } from "./analytics/addAccount.types";
import { MODULAR_DRAWER_PAGE_NAME } from "./analytics/modularDrawer.types";
import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui/index";
import { useTranslation } from "react-i18next";

const ANALYTICS_PROPERTY_FLOW = "Modular Add Account Flow";

export type ModularDrawerAddAccountFlowManagerProps = {
  currency: CryptoOrTokenCurrency;
  source: string;
  onAccountSelected?: (account: Account) => void;
};

const Title = styled(Text)`
  font-size: 24px;
  font-weight: 600;
  color: var(--palette-text-shade100);
  padding-left: 8px;
  padding-right: 8px;
  padding-bottom: 16px;
`;

const StepContainer = styled(Flex)`
  flex: 1;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const ModularDrawerAddAccountFlowManager = ({
  currency,
  source,
  onAccountSelected,
}: ModularDrawerAddAccountFlowManagerProps) => {
  const { t } = useTranslation();

  const [connectAppResult, setConnectAppResult] = useState<AppResult>();
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);

  const {
    currentStep,
    navigationDirection,
    warningReason,
    emptyAccount,
    accountToFund,
    navigateToWarningScreen,
    navigateToFundAccount,
    navigateToSelectAccount,
    navigateToScanAccounts,
    navigateToAccountsAdded,
    navigateToConnectDevice,
    handleBack,
  } = useAddAccountFlowNavigation({
    selectedAccounts,
    onAccountSelected,
  });

  const isAccountSelectionFlow = !!onAccountSelected;
  const cryptoCurrency = currency.type === "CryptoCurrency" ? currency : currency.parentCurrency;

  const handleConnect = useCallback(
    (result: AppResult) => {
      console.log(result);
      setConnectAppResult(result);
      navigateToScanAccounts();
    },
    [navigateToScanAccounts],
  );

  const renderStepContent = (step: ModularDrawerAddAccountStep) => {
    switch (step) {
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE:
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <ConnectYourDevice
              currency={cryptoCurrency}
              onConnect={handleConnect}
              analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW}
              source={source}
            />
          </StepContainer>
        );
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.SCAN_ACCOUNTS:
        if (!connectAppResult) {
          throw new Error("Missing connectAppResult");
        }
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <ScanAccounts
              currency={cryptoCurrency}
              deviceId={connectAppResult.device.deviceId}
              onRetry={navigateToConnectDevice}
              source={source}
              onComplete={accounts => {
                setSelectedAccounts(accounts);
                navigateToAccountsAdded();
              }}
              analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW}
              navigateToWarningScreen={navigateToWarningScreen}
            />
          </StepContainer>
        );
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED:
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <AccountsAdded
              accounts={selectedAccounts}
              onFundAccount={navigateToFundAccount}
              navigateToSelectAccount={navigateToSelectAccount}
              isAccountSelectionFlow={isAccountSelectionFlow}
              source={source}
            />
          </StepContainer>
        );
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING:
        if (!warningReason) {
          throw new Error("Missing warningReason");
        }
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <AccountsWarning
              warningReason={warningReason}
              currency={cryptoCurrency}
              emptyAccount={emptyAccount}
              navigateToFundAccount={navigateToFundAccount}
              source={source}
            />
          </StepContainer>
        );
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.FUND_ACCOUNT:
        if (!accountToFund) {
          throw new Error("Missing accountToFund");
        }
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <FundAccount account={accountToFund} currency={cryptoCurrency} source={source} />
          </StepContainer>
        );
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.SELECT_ACCOUNT:
        return (
          <StepContainer data-test-id="content">
            <Title>
              {onAccountSelected
                ? t("modularAssetDrawer.addAccounts.addAccountSelectionPtxFlow")
                : t("modularAssetDrawer.addAccounts.addAccountSelection")}
            </Title>
            <AccountSelection
              asset={cryptoCurrency}
              overridePageName={MODULAR_DRAWER_PAGE_NAME.FUND_ACCOUNT_LIST}
              source={source}
              flow={ADD_ACCOUNT_FLOW_NAME}
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
        currentStep={currentStep}
        warningReason={warningReason}
        data-test-id="header-gradient"
      />
      {handleBack && <BackButtonArrow onBackClick={handleBack} />}
      <AnimatedScreenWrapper
        key={currentStep}
        screenKey={currentStep}
        direction={navigationDirection}
      >
        {renderStepContent(currentStep)}
      </AnimatedScreenWrapper>
    </AnimatePresence>
  );
};

export default ModularDrawerAddAccountFlowManager;
