import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NetworkList } from "@ledgerhq/react-ui/pre-ldls";
import { ListWrapper } from "../../../components/ListWrapper";
import { useModularDrawerAnalytics } from "../../../analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "../../../analytics/modularDrawer.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { createNetworkConfigurationHook } from "@ledgerhq/live-common/modularDrawer/modules/createNetworkConfiguration";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import orderBy from "lodash/orderBy";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { accountsCount } from "../../../components/AccountCount";
import { accountsCountAndApy } from "../../../components/AccountCountApy";
import { balanceItem } from "../../../components/Balance";
import { useAccountData } from "../../../hooks/useAccountData";
import { useBalanceDeps } from "../../../hooks/useBalanceDeps";

type SelectNetworkProps = {
  networks?: CryptoOrTokenCurrency[];
  source: string;
  flow: string;
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
  networksConfig: EnhancedModularDrawerConfiguration["networks"];
  currenciesByProvider: CurrenciesByProviderId[];
  selectedAssetId?: string;
  accounts$?: Observable<WalletAPIAccount[]>;
};

export const SelectNetwork = ({
  networks,
  onNetworkSelected,
  source,
  flow,
  networksConfig,
  currenciesByProvider,
  selectedAssetId,
  accounts$,
}: SelectNetworkProps) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const featureModularDrawerBackendData = useFeature("lldModularDrawerBackendData");

  if (!networks || networks.length === 0 || !selectedAssetId) {
    return null;
  }

  const deps = {
    useAccountData,
    accountsCount,
    accountsCountAndApy,
    useBalanceDeps,
    balanceItem,
  };

  const makeNetworkConfigurationHook = createNetworkConfigurationHook(deps);

  const transformNetworks = makeNetworkConfigurationHook({
    networksConfig,
    accounts$,
    selectedAssetId,
    currenciesByProvider,
  });

  const orderedNetworks = orderBy(networks, ["name"]);

  const formattedNetworks = transformNetworks(
    featureModularDrawerBackendData?.enabled ? networks : orderedNetworks,
  );

  const onClick = (networkId: string) => {
    const network = networks.find(({ id }) => id === networkId);
    if (!network) return;

    trackModularDrawerEvent(
      "network_clicked",
      {
        network: network.name,
        page: MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION,
        flow,
        source,
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
