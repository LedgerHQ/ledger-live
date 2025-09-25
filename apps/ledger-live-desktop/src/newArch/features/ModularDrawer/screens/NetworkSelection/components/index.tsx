import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NetworkList } from "@ledgerhq/react-ui/pre-ldls";
import { ListWrapper } from "../../../components/ListWrapper";
import { useModularDrawerAnalytics } from "../../../analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "../../../analytics/modularDrawer.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { createNetworkConfigurationHook } from "@ledgerhq/live-common/modularDrawer/modules/createNetworkConfiguration";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { accountsCount } from "../../../components/AccountCount";
import { accountsCountAndApy } from "../../../components/AccountCountApy";
import { balanceItem } from "../../../components/Balance";
import { useAccountData } from "../../../hooks/useAccountData";
import { useBalanceDeps } from "../../../hooks/useBalanceDeps";

type SelectNetworkProps = {
  networks?: CryptoOrTokenCurrency[];
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
  networksConfig: EnhancedModularDrawerConfiguration["networks"];
  selectedAssetId?: string;
  accounts$?: Observable<WalletAPIAccount[]>;
};

export const SelectNetwork = ({
  networks,
  onNetworkSelected,
  networksConfig,
  selectedAssetId,
  accounts$,
}: SelectNetworkProps) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  if (!networks || networks.length === 0 || !selectedAssetId) {
    return null;
  }

  const networkConfigurationDeps = {
    useAccountData,
    accountsCount,
    accountsCountAndApy,
    useBalanceDeps,
    balanceItem,
  };

  const makeNetworkConfigurationHook = createNetworkConfigurationHook(networkConfigurationDeps);

  const transformNetworks = makeNetworkConfigurationHook({
    networksConfig,
    accounts$,
    selectedAssetId,
  });
  const networksCryptoCurrencies = networks.map(n =>
    n.type === "CryptoCurrency" ? n : n.parentCurrency,
  );

  const formattedNetworks = transformNetworks(networksCryptoCurrencies, networks);

  const onClick = (networkId: string) => {
    const network = networksCryptoCurrencies.find(({ id }) => id === networkId);
    if (!network) return;

    trackModularDrawerEvent(
      "network_clicked",
      {
        network: network.name,
        page: MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION,
      },
      {
        formatNetworkConfig: true,
        networksConfig,
      },
    );

    onNetworkSelected(network);
  };

  return (
    <ListWrapper>
      <NetworkList networks={formattedNetworks} onClick={onClick} />
    </ListWrapper>
  );
};
