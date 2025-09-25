import React, { useCallback } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  AssetType,
  NetworkItem,
  Network as NetworkType,
} from "@ledgerhq/native-ui/lib/pre-ldls/index";
import { Flex } from "@ledgerhq/native-ui";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import {
  useModularDrawerAnalytics,
  TrackDrawerScreen,
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
} from "../../analytics";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { createNetworkConfigurationHook } from "@ledgerhq/live-common/modularDrawer/modules/createNetworkConfiguration";
import { accountsCount } from "../../components/AccountCount";
import { accountsCountAndApy } from "../../components/AccountCountAndApy";
import { balanceItem } from "../../components/Balance";
import { useAccountData } from "../../hooks/useAccountData";
import { useBalanceDeps } from "../../hooks/useBalanceDeps";
import { useSelector } from "react-redux";
import { modularDrawerFlowSelector, modularDrawerSourceSelector } from "~/reducers/modularDrawer";
import { groupCurrenciesByToken } from "@ledgerhq/live-common/modularDrawer/utils/groupCurrenciesByProvider";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";

export type NetworkSelectionStepProps = {
  availableNetworks: CryptoOrTokenCurrency[];
  asset?: CryptoOrTokenCurrency;
  onNetworkSelected: (asset: CryptoOrTokenCurrency) => void;
  networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];
  assetsSorted?: AssetData[];
};

const SAFE_MARGIN_BOTTOM = 48;

const NetworkSelection = ({
  availableNetworks,
  onNetworkSelected,
  networksConfiguration,
  asset,
  assetsSorted,
}: Readonly<NetworkSelectionStepProps>) => {
  const flow = useSelector(modularDrawerFlowSelector);
  const source = useSelector(modularDrawerSourceSelector);
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const networks = availableNetworks.map(n => (n.type === "CryptoCurrency" ? n : n.parentCurrency));

  const handleNetworkClick = useCallback(
    (networkId: string) => {
      const originalNetwork = networks.find(n => n.id === networkId);
      if (originalNetwork) {
        trackModularDrawerEvent(
          EVENTS_NAME.NETWORK_CLICKED,
          {
            flow,
            source,
            network: originalNetwork.name,
            page: MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION,
          },
          {
            formatNetworkConfig: true,
            networksConfig: networksConfiguration,
          },
        );

        onNetworkSelected(originalNetwork);
      }
    },
    [networks, trackModularDrawerEvent, flow, source, networksConfiguration, onNetworkSelected],
  );

  const validAssets = groupCurrenciesByToken(assetsSorted || [], asset ? asset.id : "", networks);

  const networkConfigurationDeps = {
    useAccountData,
    accountsCount,
    accountsCountAndApy,
    useBalanceDeps,
    balanceItem,
    validAssets,
  };

  const makeNetworkConfigurationHook = createNetworkConfigurationHook(networkConfigurationDeps);

  const transformNetworks = makeNetworkConfigurationHook({
    networksConfig: networksConfiguration,
    accounts$: undefined,
    selectedAssetId: asset ? asset.id : "",
  });

  const formattedNetworks = transformNetworks(networks, availableNetworks);

  const keyExtractor = useCallback((item: AssetType, index: number) => `${item.id}-${index}`, []);

  return (
    <Flex flexGrow={1}>
      <TrackDrawerScreen
        page={EVENTS_NAME.MODULAR_NETWORK_SELECTION}
        flow={flow}
        source={source}
        networksConfig={networksConfiguration}
        formatNetworkConfig
      />
      <BottomSheetFlatList
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        data={formattedNetworks}
        keyExtractor={keyExtractor}
        renderItem={({ item }: { item: NetworkType }) => (
          <NetworkItem {...item} onClick={() => handleNetworkClick(item.id)} />
        )}
        contentContainerStyle={{
          paddingBottom: SAFE_MARGIN_BOTTOM,
        }}
      />
    </Flex>
  );
};

export default React.memo(NetworkSelection);
