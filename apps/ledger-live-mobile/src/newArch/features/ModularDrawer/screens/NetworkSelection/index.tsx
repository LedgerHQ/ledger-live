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

const NetworkSelection = ({
  availableNetworks,
  onNetworkSelected,
  flow,
  source,
  networksConfiguration,
}: Readonly<NetworkSelectionStepProps>) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const handleNetworkClick = (networkId: string) => {
    const originalNetwork = availableNetworks.find(n => n.id === networkId);
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
  };

  const transformNetworks = createNetworkConfigurationHook({
    networksConfig: networksConfiguration,
    accounts$: undefined,
  });

  const orderedNetworks = orderBy(availableNetworks, ["name"]);

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
        data={formattedNetworks}
        keyExtractor={keyExtractor}
        renderItem={({ item }: { item: NetworkType }) => (
          <NetworkItem {...item} onClick={() => handleNetworkClick(item.id)} />
        )}
      />
    </Flex>
  );
};

export default React.memo(NetworkSelection);
