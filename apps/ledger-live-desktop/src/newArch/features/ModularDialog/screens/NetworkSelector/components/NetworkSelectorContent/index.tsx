import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ListWrapper } from "../../../../components/ListWrapper";
import { useModularDrawerAnalytics } from "../../../../analytics/useModularDialogAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "../../../../analytics/modularDialog.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { createNetworkConfigurationHook } from "@ledgerhq/live-common/modularDrawer/modules/createNetworkConfiguration";
import { balanceItem } from "../../../../components/Balance";
import { useAccountData } from "../../../../hooks/useAccountData";
import { useBalanceDeps } from "../../../../hooks/useBalanceDeps";
import { NetworkVirtualList } from "../NetworkVirtualList";
import { accountsApy } from "../../../../components/Account/AccountApy";
import { accountsCount } from "../../../../components/Account/AccountCount";
import { accountsCountAndApy } from "../../../../components/Account/AccountCountApy";

type NetworkSelectorContentProps = {
  networks?: CryptoOrTokenCurrency[];
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
  networksConfig: EnhancedModularDrawerConfiguration["networks"];
  selectedAssetId?: string;
};

export const NetworkSelectorContent = ({
  networks,
  onNetworkSelected,
  networksConfig,
  selectedAssetId,
}: NetworkSelectorContentProps) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  if (!networks || networks.length === 0 || !selectedAssetId) {
    return null;
  }

  const networkConfigurationDeps = {
    useAccountData,
    accountsCount,
    accountsCountAndApy,
    accountsApy,
    useBalanceDeps,
    balanceItem,
  };

  const makeNetworkConfigurationHook = createNetworkConfigurationHook(networkConfigurationDeps);

  const transformNetworks = makeNetworkConfigurationHook({
    networksConfig,
  });

  const formattedNetworks = transformNetworks(networks);

  const onClick = (networkId: string) => {
    const network = formattedNetworks.find(network =>
      network.type === "CryptoCurrency"
        ? network.id === networkId
        : network.parentCurrency.id === networkId,
    );

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
      <NetworkVirtualList networks={formattedNetworks} onClick={onClick} />
    </ListWrapper>
  );
};
