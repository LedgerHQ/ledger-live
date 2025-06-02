import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AnimatePresence } from "framer-motion";
import React from "react";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { ModularDrawerAddAccountStep } from "./types";

import { AddAccountHeader } from "./components/Header/AddAccountHeader";
import ConnectYourDevice from "./screens/ConnectYourDevice";

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

  // const handleBack = useMemo(() => {
  //   const canGoBackToAsset = !hasOneCurrency && assetsToDisplay.length > 1;
  //   const canGoBackToNetwork = !hasOneNetwork && networksToDisplay && networksToDisplay.length > 1;

  //   switch (currentStep) {
  //     case "NETWORK_SELECTION": {
  //       return canGoBackToAsset ? goBackToAssetSelection : undefined;
  //     }
  //     case "ACCOUNT_SELECTION": {
  //       if (
  //         (hasOneNetwork || !networksToDisplay || networksToDisplay.length <= 1) &&
  //         !hasOneCurrency
  //       ) {
  //         return goBackToAssetSelection;
  //       } else if (canGoBackToNetwork) {
  //         return goBackToNetworkSelection;
  //       }
  //       return undefined;
  //     }
  //     default: {
  //       return undefined;
  //     }
  //   }
  // }, [
  //   assetsToDisplay.length,
  //   currentStep,
  //   goBackToAssetSelection,
  //   goBackToNetworkSelection,
  //   hasOneCurrency,
  //   hasOneNetwork,
  //   networksToDisplay,
  // ]);

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
