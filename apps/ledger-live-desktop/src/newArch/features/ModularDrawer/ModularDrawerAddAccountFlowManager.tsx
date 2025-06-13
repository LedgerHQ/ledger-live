import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { Flex } from "@ledgerhq/react-ui/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { AnimatePresence, motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import { AddAccountHeader } from "./components/Header/AddAccountHeader";
import ConnectYourDevice from "./screens/ConnectYourDevice";
import ScanAccounts from "./screens/ScanAccounts";
import {
  MODULAR_DRAWER_ADD_ACCOUNT_STEP,
  ModularDrawerAddAccountStep,
  NavigationDirection,
} from "./types";

const ANALYTICS_PROPERTY_FLOW = "Modular Add Account Flow";

type Props = {
  currency: CryptoOrTokenCurrency;
  drawerConfiguration?: EnhancedModularDrawerConfiguration;
  onConnect?: (result: AppResult) => void;
  onScannedAccounts?: (accounts: Account[]) => void;
};

const ModularDrawerAddAccountFlowManager = ({ currency, onConnect, onScannedAccounts }: Props) => {
  const [currentStep, setCurrentStep] = useState<ModularDrawerAddAccountStep>(
    MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE,
  );

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

  const navigationDirection: NavigationDirection = "FORWARD";

  return (
    <AnimatePresence mode="sync" data-test-id="animated">
      <motion.div
        custom={navigationDirection}
        variants={{
          enter: (direction: NavigationDirection) => ({
            x: direction === "FORWARD" ? 100 : -100,
            opacity: 0,
          }),
          center: { x: 0, opacity: 1 },
          exit: (direction: NavigationDirection) => ({
            x: direction === "FORWARD" ? -100 : 100,
            opacity: 0,
          }),
        }}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{
          position: "absolute",
          display: "flex",
          bottom: 0,
          top: 0,
          width: "100%",
          height: "100%",
          scrollbarWidth: "none",
        }}
      >
        <AddAccountHeader step={currentStep} onBackClick={handleBack} />

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
      </motion.div>
    </AnimatePresence>
  );
};

export default ModularDrawerAddAccountFlowManager;
