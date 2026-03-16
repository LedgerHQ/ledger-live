import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useModularDialogAnalytics } from "../../../../analytics/useModularDialogAnalytics";
import { MODULAR_DIALOG_PAGE_NAME } from "../../../../analytics/modularDialog.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { useNetworkConfiguration } from "@ledgerhq/live-common/modularDrawer/modules/createNetworkConfiguration";
import { balanceItem } from "../../../../components/Balance";
import { useAccountData } from "../../../../hooks/useAccountData";
import { useBalanceDeps } from "../../../../hooks/useBalanceDeps";
import { NetworkVirtualList } from "../NetworkVirtualList";
import { ApyIndicator } from "LLD/features/ModularDrawer/components/ApyIndicator";
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
  const { trackModularDialogEvent } = useModularDialogAnalytics();

  const formattedNetworks = useNetworkConfiguration(networks ?? [], {
    useAccountData,
    accountsCount,
    accountsCountAndApy,
    ApyIndicator,
    useBalanceDeps,
    balanceItem,
    ...networksConfig,
  });

  if (!networks || networks.length === 0 || !selectedAssetId) {
    return null;
  }

  const onClick = (networkId: string) => {
    const network = formattedNetworks.find(network =>
      network.type === "CryptoCurrency"
        ? network.id === networkId
        : network.parentCurrency.id === networkId,
    );

    if (!network) return;

    trackModularDialogEvent(
      "network_clicked",
      {
        network: network.name,
        page: MODULAR_DIALOG_PAGE_NAME.MODULAR_NETWORK_SELECTION,
      },
      {
        formatNetworkConfig: true,
        networksConfig,
      },
    );

    onNetworkSelected(network);
  };

  return <NetworkVirtualList networks={formattedNetworks} onClick={onClick} />;
};
