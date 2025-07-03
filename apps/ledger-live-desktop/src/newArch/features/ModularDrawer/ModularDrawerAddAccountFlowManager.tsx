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

const ANALYTICS_PROPERTY_FLOW = "Modular Add Account Flow";

type Props = {
  currency: CryptoOrTokenCurrency;
  source: string;
  onAccountSelected?: (account: Account) => void;
};

const ModularDrawerAddAccountFlowManager = ({ currency, source, onAccountSelected }: Props) => {
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
      setConnectAppResult(result);
      navigateToScanAccounts();
    },
    [navigateToScanAccounts],
  );

  const renderStepContent = (step: ModularDrawerAddAccountStep) => {
    switch (step) {
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE:
        return (
          <ConnectYourDevice
            currency={cryptoCurrency}
            onConnect={handleConnect}
            analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW}
            source={source}
          />
        );
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.SCAN_ACCOUNTS:
        if (!connectAppResult) {
          throw new Error("Missing connectAppResult");
        }
        return (
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
        );
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED:
        return (
          <AccountsAdded
            accounts={selectedAccounts}
            onFundAccount={navigateToFundAccount}
            navigateToSelectAccount={navigateToSelectAccount}
            isAccountSelectionFlow={isAccountSelectionFlow}
            source={source}
          />
        );
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING:
        if (!warningReason) {
          throw new Error("Missing warningReason");
        }
        return (
          <AccountsWarning
            warningReason={warningReason}
            currency={cryptoCurrency}
            emptyAccount={emptyAccount}
            navigateToFundAccount={navigateToFundAccount}
            source={source}
          />
        );
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.FUND_ACCOUNT:
        if (!accountToFund) {
          throw new Error("Missing accountToFund");
        }
        return <FundAccount account={accountToFund} currency={cryptoCurrency} source={source} />;
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.SELECT_ACCOUNT:
        return (
          <AccountSelection
            asset={cryptoCurrency}
            overridePageName={MODULAR_DRAWER_PAGE_NAME.FUND_ACCOUNT_LIST}
            source={source}
            flow={ADD_ACCOUNT_FLOW_NAME}
            onAccountSelected={accountToFund => navigateToFundAccount(accountToFund as Account)}
            hideAddAccountButton
          />
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
        <Flex
          data-test-id="content"
          flex={1}
          flexDirection="column"
          height="100%"
          width="100%"
          paddingX="8px"
        >
          {renderStepContent(currentStep)}
        </Flex>
      </AnimatedScreenWrapper>
    </AnimatePresence>
  );
};

export default ModularDrawerAddAccountFlowManager;
