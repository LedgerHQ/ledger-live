import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { type Network } from "@ledgerhq/native-ui/pre-ldls/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { composeHooks } from "@ledgerhq/live-common/utils/composeHooks";
import { useLeftAccountsModule, useLeftAccountsApyModule } from "./useLeftAccountsModule";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { useBalanceDeps, createBalanceItem } from "../../../components/Balance";
import { createUseRightBalanceNetwork } from "@ledgerhq/live-common/modularDrawer/hooks/useRightBalanceNetwork";

type Props = {
  networksConfig: EnhancedModularDrawerConfiguration["networks"];
  accounts$?: Observable<WalletAPIAccount[]>;
  currenciesByProvider: CurrenciesByProviderId[];
  selectedAssetId: string;
};

type NetworksConfiguration = EnhancedModularDrawerConfiguration["networks"];
type LeftElement = NonNullable<NetworksConfiguration>["leftElement"];
type RightElement = NonNullable<NetworksConfiguration>["rightElement"];

const getLeftElement = (leftElement: LeftElement) => {
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

const getRightElement = (rightElement: RightElement) => {
  switch (rightElement) {
    case "balance":
      return createUseRightBalanceNetwork({
        useBalanceDeps,
        createBalanceItem,
      });
    case "undefined":
    default:
      return undefined;
  }
};

const createNetworkConfigurationHook = ({
  networksConfig,
  accounts$,
  currenciesByProvider,
  selectedAssetId,
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
          hook({ assets, accounts$, currenciesByProvider, selectedAssetId }),
      ),
    );
    return composedHook(assets);
  };
};

export default createNetworkConfigurationHook;
