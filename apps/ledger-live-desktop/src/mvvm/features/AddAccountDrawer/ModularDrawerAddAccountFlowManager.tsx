import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { Flex, Text } from "@ledgerhq/react-ui/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { AnimatePresence } from "framer-motion";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { MODULAR_DRAWER_PAGE_NAME } from "../ModularDrawer/analytics/modularDrawer.types";
import AnimatedScreenWrapper from "../ModularDrawer/components/AnimatedScreenWrapper";
import { BackButtonArrow } from "../ModularDrawer/components/BackButton";
import { AccountSelection } from "../ModularDrawer/screens/AccountSelection";
import HeaderGradient from "./components/HeaderGradient";
import { MODULAR_DRAWER_ADD_ACCOUNT_STEP, ModularDrawerAddAccountStep } from "./domain";
import AccountsAdded from "./screens/AccountsAdded";
import AccountsWarning from "./screens/AccountsWarning";
import ConnectYourDevice from "./screens/ConnectYourDevice";
import EditAccountName from "./screens/EditAccountName";
import FundAccount from "./screens/FundAccount";
import ScanAccounts from "./screens/ScanAccounts";
import { useAddAccountFlowNavigation } from "./useAddAccountFlowNavigation";
import { useDispatch } from "LLD/hooks/redux";
import { setFlowValue } from "~/renderer/reducers/modularDrawer";
import { getLLDCoinFamily } from "~/renderer/families";
import { ADD_ACCOUNT_FLOW_NAME } from "./analytics/addAccount.types";

export const ANALYTICS_PROPERTY_FLOW = "Modular Add Account Flow";

export type ModularDrawerAddAccountFlowManagerProps = {
  currency: CryptoOrTokenCurrency;
  onAccountSelected?: (account: Account | TokenAccount, parentAccount?: Account) => void;
};

export const Title = styled(Text)`
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
    accountToEdit,
    accountToFund,
    navigateBack,
    navigateToWarningScreen,
    navigateToEditAccountName,
    navigateToFundAccount,
    navigateToSelectAccount,
    navigateToScanAccounts,
    navigateToAccountsAdded,
    navigateToConnectDevice,
  } = useAddAccountFlowNavigation({
    selectedAccounts,
    onAccountSelected,
    originalCurrency: currency,
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

  const dispatch = useDispatch();

  const specific = getLLDCoinFamily(cryptoCurrency.family);
  const CustomModularDrawerAddAccountFlowManager = specific?.ModularDrawerAddAccountFlowManager;

  if (CustomModularDrawerAddAccountFlowManager) {
    return (
      <CustomModularDrawerAddAccountFlowManager
        currency={currency}
        onAccountSelected={onAccountSelected}
      />
    );
  }

  const renderStepContent = (step: ModularDrawerAddAccountStep) => {
    switch (step) {
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE:
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <ConnectYourDevice
              currency={cryptoCurrency}
              onConnect={handleConnect}
              analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW}
            />
          </StepContainer>
        );
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.SCAN_ACCOUNTS:
        if (!connectAppResult) {
          throw new Error("Missing 'connectAppResult'");
        }
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <ScanAccounts
              currency={cryptoCurrency}
              deviceId={connectAppResult.device.deviceId}
              onRetry={navigateToConnectDevice}
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
              navigateToEditAccountName={navigateToEditAccountName}
              navigateToFundAccount={navigateToFundAccount}
              navigateToSelectAccount={navigateToSelectAccount}
              isAccountSelectionFlow={isAccountSelectionFlow}
            />
          </StepContainer>
        );
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING:
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
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.EDIT_ACCOUNT_NAME:
        if (!accountToEdit) {
          throw new Error("Missing 'accountToEdit'");
        }
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <EditAccountName account={accountToEdit} navigateBack={navigateBack} />
          </StepContainer>
        );
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.FUND_ACCOUNT:
        if (!accountToFund) {
          throw new Error("Missing 'accountToFund'");
        }
        return (
          <StepContainer paddingX="8px" data-test-id="content">
            <FundAccount account={accountToFund} currency={cryptoCurrency} />
          </StepContainer>
        );
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.SELECT_ACCOUNT:
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
              overridePageName={MODULAR_DRAWER_PAGE_NAME.FUND_ACCOUNT_LIST}
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
      {navigateBack && <BackButtonArrow onBackClick={navigateBack} />}
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
