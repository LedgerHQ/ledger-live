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
import orderBy from "lodash/orderBy";
import createNetworkConfigurationHook from "./modules/createNetworkConfigurationHook";

export type NetworkSelectionStepProps = {
  availableNetworks: CryptoOrTokenCurrency[];
  onNetworkSelected: (asset: CryptoOrTokenCurrency) => void;
  flow: string;
  source: string;
  networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];
};

const SAFE_MARGIN_BOTTOM = 48;

const NetworkSelection = ({
  availableNetworks,
  onNetworkSelected,
  flow,
  source,
  networksConfiguration,
}: Readonly<NetworkSelectionStepProps>) => {
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

  const transformNetworks = createNetworkConfigurationHook({
    networksConfig: networksConfiguration,
    accounts$: undefined,
  });

  const orderedNetworks = orderBy(networks, ["name"]);

  const formattedNetworks = transformNetworks(orderedNetworks);

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
