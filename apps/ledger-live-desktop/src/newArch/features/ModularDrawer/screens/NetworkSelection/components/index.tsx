import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NetworkList } from "@ledgerhq/react-ui/pre-ldls";
import { ListWrapper } from "../../../components/ListWrapper";
import { useModularDrawerAnalytics } from "../../../analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "../../../analytics/types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import createNetworkConfigurationHook from "../modules/createNetworkConfigurationHook";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";

type SelectNetworkProps = {
  networks?: CryptoOrTokenCurrency[];
  source: string;
  flow: string;
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
  networksConfig: EnhancedModularDrawerConfiguration["networks"];
  currenciesByProvider: CurrenciesByProviderId[];
  selectedAssetId?: string;
};

export const SelectNetwork = ({
  networks,
  onNetworkSelected,
  source,
  flow,
  networksConfig,
  currenciesByProvider,
  selectedAssetId,
}: SelectNetworkProps) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  if (!networks || networks.length === 0 || !selectedAssetId) {
    return null;
  }

  const transformNetworks = createNetworkConfigurationHook({
    networksConfig,
    currenciesByProvider,
    selectedAssetId,
  });

  const formattedNetworks = transformNetworks(networks);

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
