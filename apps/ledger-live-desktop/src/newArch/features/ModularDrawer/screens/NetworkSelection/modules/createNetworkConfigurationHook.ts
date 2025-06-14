import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { Network } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { composeHooks } from "LLD/utils/composeHooks";
import { useLeftAccountsModule } from "./useLeftAccountsModule";

type Props = {
  networksConfig: EnhancedModularDrawerConfiguration["networks"];
};

const getLeftElement = (leftElement: string) => {
  switch (leftElement) {
    case "numberOfAccounts":
      return useLeftAccountsModule;
    case "numberOfAccountsAndApy":
    case "undefined":
    default:
      return undefined;
  }
};

const createNetworkConfigurationHook = ({
  networksConfig,
}: Props): ((assets: CryptoOrTokenCurrency[]) => (CryptoOrTokenCurrency & Network)[]) => {
  const { leftElement = "undefined" } = networksConfig ?? {};

  const leftHook = getLeftElement(leftElement);

  const hooks = [leftHook].filter(Boolean) as Array<(assets: CryptoOrTokenCurrency[]) => Network[]>;

  return composeHooks<CryptoOrTokenCurrency, Network>(...hooks);
};

export default createNetworkConfigurationHook;
