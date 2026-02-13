import React, { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useModularDialogAnalytics } from "../../../../analytics/useModularDialogAnalytics";
import { MODULAR_DIALOG_PAGE_NAME } from "../../../../analytics/modularDialog.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { createNetworkConfigurationHook } from "@ledgerhq/live-common/modularDrawer/modules/createNetworkConfiguration";
import { getApyAppearance } from "@ledgerhq/live-common/modularDrawer/utils/getApyAppearance";
import { balanceItem } from "../../../../components/Balance";
import { useAccountData } from "../../../../hooks/useAccountData";
import { useBalanceDeps } from "../../../../hooks/useBalanceDeps";
import { NetworkVirtualList } from "../NetworkVirtualList";
import { accountsApy } from "../../../../components/Account/AccountApy";
import { accountsCount } from "../../../../components/Account/AccountCount";
import { accountsCountAndApy } from "../../../../components/Account/AccountCountApy";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";

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

  // Determine APY appearance based on user's region (UK users see grey, others see green)
  const { region } = getParsedSystemDeviceLocale();
  const apyAppearance = getApyAppearance(region);

  // Create wrapped APY functions with the appearance pre-configured
  const accountsApyWithAppearance = useMemo(
    () =>
      (props: Parameters<typeof accountsApy>[0]) =>
        accountsApy({ ...props, appearance: apyAppearance }),
    [apyAppearance],
  );

  const accountsCountAndApyWithAppearance = useMemo(
    () =>
      (props: Parameters<typeof accountsCountAndApy>[0]) =>
        accountsCountAndApy({ ...props, appearance: apyAppearance }),
    [apyAppearance],
  );

  if (!networks || networks.length === 0 || !selectedAssetId) {
    return null;
  }

  const networkConfigurationDeps = {
    useAccountData,
    accountsCount,
    accountsCountAndApy: accountsCountAndApyWithAppearance,
    accountsApy: accountsApyWithAppearance,
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
