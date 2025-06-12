import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AnimatePresence } from "framer-motion";
import React from "react";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { AddAccountHeader } from "./components/Header/AddAccountHeader";
import ConnectYourDevice from "./screens/ConnectYourDevice";
import { ModularDrawerAddAccountStep } from "./types";

const ANALYTICS_PROPERTY_FLOW = "Modular Add Account Flow";

type Props = {
  currency: CryptoOrTokenCurrency;
  drawerConfiguration?: EnhancedModularDrawerConfiguration;
};

const ModularDrawerAddAccountFlowManager = ({
  currency,
  // drawerConfiguration,
}: Props) => {
  // const { assets: assetConfiguration, networks: networkConfiguration } = drawerConfiguration ?? {};

  // TODO
  const handleBack = () => {};

  const currentStep = "CONNECT_YOUR_DEVICE";

  const renderStepContent = (step: ModularDrawerAddAccountStep) => {
    switch (step) {
      case "CONNECT_YOUR_DEVICE":
        return (
          <ConnectYourDevice
            currency={currency}
            onConnect={() => {}}
            // TODO review
            analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW}
          />
        );
      case "SCAN_ACCOUNTS":
        // return <ScanAccounts currency={currency} analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW} />;
        return null;
      case "ADD_ACCOUNTS":
        // return <AddAccounts currency={currency} analyticsPropertyFlow={ANALYTICS_PROPERTY_FLOW} />;
        return null;
      default:
        return null;
    }
  };

  const navigationDirection = "FORWARD";

  return (
    <>
      <AddAccountHeader step={currentStep} onBackClick={handleBack} />
      <AnimatePresence mode="sync">
        <AnimatedScreenWrapper
          key={currentStep}
          screenKey={currentStep}
          direction={navigationDirection}
        >
          {renderStepContent(currentStep)}
        </AnimatedScreenWrapper>
      </AnimatePresence>
    </>
  );
};

export default ModularDrawerAddAccountFlowManager;
