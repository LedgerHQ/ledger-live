import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AnimatePresence } from "framer-motion";
import React, { useMemo, useState } from "react";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { AddAccountHeader } from "./components/Header/AddAccountHeader";
import ConnectYourDevice from "./screens/ConnectYourDevice";
import ScanAccounts from "./screens/ScanAccounts";
import { ModularDrawerAddAccountStep } from "./types";
import { Box, Flex } from "@ledgerhq/react-ui/index";

const ANALYTICS_PROPERTY_FLOW = "Modular Add Account Flow";

type Props = {
  currency: CryptoOrTokenCurrency;
  drawerConfiguration?: EnhancedModularDrawerConfiguration;
  // accounts$?: Observable<WalletAPIAccount[]>;
  // TODO review callbacks
  // onAssetSelected?: (currency: CryptoOrTokenCurrency) => void;
  // onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
};

const ModularDrawerAddAccountFlowManager = ({
  currency,
  // drawerConfiguration,
  // accounts$,
  // onAssetSelected,
  // onAccountSelected,
}: Props) => {
  // const { assets: assetConfiguration, networks: networkConfiguration } = drawerConfiguration ?? {};

  // const [networksToDisplay, setNetworksToDisplay] = useState<CryptoOrTokenCurrency[]>();

  // const { currentStep, navigationDirection, goToStep } = useModularDrawerNavigation();
  // const isSelectAccountFlow = !!onAccountSelected;
  // const hasOneCurrency = currencies.length === 1;
  // const hasOneNetwork = networksToDisplay?.length === 1;

  // const {
  //   selectedAsset,
  //   selectedNetwork,
  //   searchedValue,
  //   setSearchedValue,
  //   handleNetworkSelected,
  //   handleAssetSelected,
  //   handleAccountSelected,
  //   goBackToAssetSelection,
  //   goBackToNetworkSelection,
  // } = useModularDrawerFlowState({
  //   currenciesByProvider,
  //   assetsToDisplay,
  //   currenciesIdsArray,
  //   isSelectAccountFlow,
  //   hasOneNetwork,
  //   setNetworksToDisplay,
  //   goToStep,
  //   onAssetSelected,
  //   onAccountSelected,
  // });

  // const assetTypes = useMemo(
  //   () =>
  //     currenciesByProvider.map((provider: CurrenciesByProviderId) => ({
  //       id: provider.providerId,
  //       name: provider.providerId,
  //       ticker: provider.providerId,
  //     })),
  //   [currenciesByProvider],
  // );

  const [currentStep, setCurrentStep] =
    useState<ModularDrawerAddAccountStep>("CONNECT_YOUR_DEVICE");

  // DEBUG
  // const [currentStep, setCurrentStep] = useState<ModularDrawerAddAccountStep>("SCAN_ACCOUNTS");

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

  const [connectAppResult, setConnectAppResult] = useState<AppResult | null>(null);

  const renderStepContent = (step: ModularDrawerAddAccountStep) => {
    switch (step) {
      case "CONNECT_YOUR_DEVICE":
        return (
          <ConnectYourDevice
            currency={currency}
            onConnect={result => {
              setConnectAppResult(result);
              setCurrentStep("SCAN_ACCOUNTS");
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
            onComplete={() => {
              throw new Error("Missing implementation of `onComplete`");
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

  // const navigationDirection = "FORWARD";

  return (
    <Flex height="100%" data-test-id="wrapper">
      <AddAccountHeader step={currentStep} onBackClick={handleBack} />
      <AnimatePresence mode="sync" data-test-id="animated">
        {/*
        TODO review
        <AnimatedScreenWrapper
          key={currentStep}
          screenKey={currentStep}
          direction={navigationDirection}
        > */}
        <Flex flex={1} data-test-id="content" flexDirection="column">
          {renderStepContent(currentStep)}
        </Flex>
      </AnimatePresence>
    </Flex>
  );
};

export default ModularDrawerAddAccountFlowManager;
