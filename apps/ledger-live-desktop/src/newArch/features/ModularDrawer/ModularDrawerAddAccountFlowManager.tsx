import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { Flex } from "@ledgerhq/react-ui/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AnimatePresence } from "framer-motion";
import React, { useMemo, useState } from "react";
import ConnectYourDevice from "./screens/ConnectYourDevice";
import ScanAccounts from "./screens/ScanAccounts";
import {
  MODULAR_DRAWER_ADD_ACCOUNT_STEP,
  ModularDrawerAddAccountStep,
  NavigationDirection,
} from "./types";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { BackButtonArrow } from "./components/BackButton";
import { Account } from "@ledgerhq/types-live";
import AccountsAdded from "./screens/AccountsAdded";

const ANALYTICS_PROPERTY_FLOW = "Modular Add Account Flow";

type Props = {
  currency: CryptoOrTokenCurrency;
  drawerConfiguration?: EnhancedModularDrawerConfiguration;
  onConnect?: (result: AppResult) => void;
};

const ModularDrawerAddAccountFlowManager = ({ currency, onConnect }: Props) => {
  const [currentStep, setCurrentStep] = useState<ModularDrawerAddAccountStep>(
    MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE,
  );

  const [connectAppResult, setConnectAppResult] = useState<AppResult | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);

  const cryptoCurrency = currency.type === "CryptoCurrency" ? currency : currency.parentCurrency;

  const handleBack = useMemo(() => {
    switch (currentStep) {
      case "CONNECT_YOUR_DEVICE": {
        return undefined;
      }
      case "SCAN_ACCOUNTS": {
        return () => {
          setCurrentStep("CONNECT_YOUR_DEVICE");
        };
      }
      case "ACCOUNTS_ADDED": {
        return undefined;
      }
      default: {
        return undefined;
      }
    }
  }, [currentStep]);

  const renderStepContent = (step: ModularDrawerAddAccountStep) => {
    switch (step) {
      case "CONNECT_YOUR_DEVICE":
        return (
          <ConnectYourDevice
            currency={cryptoCurrency}
            onConnect={result => {
              setConnectAppResult(result);
              setCurrentStep("SCAN_ACCOUNTS");
              onConnect?.(result);
            }}
            analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW}
          />
        );
      case "SCAN_ACCOUNTS":
        if (!connectAppResult) {
          throw new Error("Missing connectAppResult");
        }
        return (
          <ScanAccounts
            currency={cryptoCurrency}
            deviceId={connectAppResult.device.deviceId}
            onComplete={accounts => {
              setSelectedAccounts(accounts);
              setCurrentStep("ACCOUNTS_ADDED");
            }}
            analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW}
          />
        );
      case "ACCOUNTS_ADDED":
        return <AccountsAdded accounts={selectedAccounts} />;
      default:
        return null;
    }
  };

  const navigationDirection: NavigationDirection = "FORWARD";

  return (
    <AnimatePresence initial={false} mode="sync" data-test-id="add-account-animated">
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
          paddingBottom={40}
          paddingX={24}
          rowGap={24}
        >
          {renderStepContent(currentStep)}
        </Flex>
      </AnimatedScreenWrapper>
    </AnimatePresence>
  );
};

export default ModularDrawerAddAccountFlowManager;
