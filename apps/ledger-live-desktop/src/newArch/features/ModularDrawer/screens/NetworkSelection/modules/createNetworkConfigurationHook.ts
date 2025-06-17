import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { Network } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { composeHooks } from "LLD/utils/composeHooks";
import { useLeftAccountsModule } from "./useLeftAccountsModule";
import { useRightBalanceModule } from "./useRightBalanceModule";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";

type Props = {
  networksConfig: EnhancedModularDrawerConfiguration["networks"];
  currenciesByProvider: CurrenciesByProviderId[];
  selectedAssetId: string;
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

const getRightElement = (rightElement: string) => {
  switch (rightElement) {
    case "balance":
      return useRightBalanceModule;
    case "undefined":
    default:
      return undefined;
  }
};

const createNetworkConfigurationHook = ({
  networksConfig,
  selectedAssetId,
  currenciesByProvider,
}: Props): ((assets: CryptoOrTokenCurrency[]) => (CryptoOrTokenCurrency & Network)[]) => {
  const { leftElement = "undefined", rightElement = "undefined" } = networksConfig ?? {};

  const leftHook = getLeftElement(leftElement);
  const rightHook = getRightElement(rightElement);

  const hooks = [rightHook, leftHook].filter(Boolean) as Array<
    (
      assets: CryptoOrTokenCurrency[],
      selectedAssetId?: string,
      currenciesByProvider?: CurrenciesByProviderId[],
    ) => Network[]
  >;

  return (assets: CryptoOrTokenCurrency[]) => {
    const composedHook = composeHooks<CryptoOrTokenCurrency, Network>(
      ...hooks.map(
        hook => (assets: CryptoOrTokenCurrency[]) =>
          hook(assets, selectedAssetId, currenciesByProvider),
      ),
    );
    return composedHook(assets);
  };
};

export default createNetworkConfigurationHook;
