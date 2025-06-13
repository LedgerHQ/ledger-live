import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { Flex } from "@ledgerhq/react-ui/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { AnimatePresence } from "framer-motion";
import React, { useMemo, useState } from "react";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { AddAccountHeader } from "./components/Header/AddAccountHeader";
import ConnectYourDevice from "./screens/ConnectYourDevice";
import ScanAccounts from "./screens/ScanAccounts";
import { ModularDrawerAddAccountStep } from "./types";

const ANALYTICS_PROPERTY_FLOW = "Modular Add Account Flow";

type Props = {
  currency: CryptoOrTokenCurrency;
  drawerConfiguration?: EnhancedModularDrawerConfiguration;
  onConnect?: (result: AppResult) => void;
  onScannedAccounts?: (accounts: Account[]) => void;
};

const ModularDrawerAddAccountFlowManager = ({
  currency,
  onConnect,
  onScannedAccounts,
}: Props) => {
  const [currentStep, setCurrentStep] =
    useState<ModularDrawerAddAccountStep>("CONNECT_YOUR_DEVICE");

  const [connectAppResult, setConnectAppResult] = useState<AppResult | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);

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
        return () => {
          setCurrentStep("SCAN_ACCOUNTS");
        };
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
            currency={currency}
            onConnect={result => {
              setConnectAppResult(result);
              setCurrentStep("SCAN_ACCOUNTS");
              onConnect?.(result);
            }}
            // TODO review
            analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW}
          />
        );
      case "SCAN_ACCOUNTS":
        if (!connectAppResult) {
          throw new Error("Missing connectAppResult");
        }
        if (currency.type !== "CryptoCurrency") {
          throw new Error("ScanAccounts only supports CryptoCurrency");
        }
        // TODO should pass this down? analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW}
        return (
          <ScanAccounts
            currency={currency}
            deviceId={connectAppResult.device.deviceId}
            onComplete={accounts => {
              setSelectedAccounts(accounts);
              onScannedAccounts?.(accounts);
              setCurrentStep("ACCOUNTS_ADDED");
            }}
          />
        );
      case "ACCOUNTS_ADDED":
        // return <AccountsAdded currency={currency} analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW} />;
        return null;
      default:
        return null;
    }
  };

  const navigationDirection = "FORWARD";

  return (
    <Flex height="100%" data-test-id="wrapper">
      <Flex position="absolute" zIndex={1} height="100%" width="100%" bottom={0} top={0}>
        <AddAccountHeader step={currentStep} onBackClick={handleBack} />
        <AnimatePresence mode="sync" data-test-id="animated">
          <AnimatedScreenWrapper
            key={currentStep}
            screenKey={currentStep}
            direction={navigationDirection}
          >
            <Flex
              data-test-id="content"
              flex={1}
              flexDirection="column"
              paddingBottom={40}
              paddingTop={76}
              paddingX={40}
              rowGap={24}
            >
              {renderStepContent(currentStep)}
            </Flex>
          </AnimatedScreenWrapper>
        </AnimatePresence>
      </Flex>
    </Flex>
  );
};

export default ModularDrawerAddAccountFlowManager;
