import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { Network } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { composeHooks } from "LLD/utils/composeHooks";
import { useLeftAccountsApyModule, useLeftAccountsModule } from "./useLeftAccountsModule";
import { useRightBalanceModule } from "./useRightBalanceModule";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";

type Props = {
  networksConfig: EnhancedModularDrawerConfiguration["networks"];
  currenciesByProvider: CurrenciesByProviderId[];
  selectedAssetId: string;
  accounts$?: Observable<WalletAPIAccount[]>;
};

const getLeftElement = (leftElement: string) => {
  switch (leftElement) {
    case "numberOfAccounts":
      return useLeftAccountsModule;
    case "numberOfAccountsAndApy":
      return useLeftAccountsApyModule;
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
  accounts$,
}: Props): ((assets: CryptoOrTokenCurrency[]) => (CryptoOrTokenCurrency & Network)[]) => {
  const { leftElement = "undefined", rightElement = "undefined" } = networksConfig ?? {};

  const leftHook = getLeftElement(leftElement);
  const rightHook = getRightElement(rightElement);

  const hooks = [rightHook, leftHook].filter((hook): hook is NonNullable<typeof hook> =>
    Boolean(hook),
  );

  return (assets: CryptoOrTokenCurrency[]) => {
    const composedHook = composeHooks<CryptoOrTokenCurrency, Network>(
      ...hooks.map(
        hook => (assets: CryptoOrTokenCurrency[]) =>
          hook({ assets, selectedAssetId, currenciesByProvider, accounts$ }),
      ),
    );
    return composedHook(assets);
  };
};

export default createNetworkConfigurationHook;
