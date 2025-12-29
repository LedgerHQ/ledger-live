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
import { accountsApy } from "../../components/AccountApy";
import { balanceItem } from "../../components/Balance";
import { useAccountData } from "../../hooks/useAccountData";
import { useBalanceDeps } from "../../hooks/useBalanceDeps";
import { useSelector } from "~/context/store";
import { modularDrawerFlowSelector, modularDrawerSourceSelector } from "~/reducers/modularDrawer";
import { withDiscreetMode } from "~/context/DiscreetModeContext";

export type NetworkSelectionStepProps = {
  availableNetworks: CryptoOrTokenCurrency[];
  onNetworkSelected: (asset: CryptoOrTokenCurrency) => void;
  networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];
};

const SAFE_MARGIN_BOTTOM = 48;

const NetworkSelection = ({
  availableNetworks,
  onNetworkSelected,
  networksConfiguration,
}: Readonly<NetworkSelectionStepProps>) => {
  const flow = useSelector(modularDrawerFlowSelector);
  const source = useSelector(modularDrawerSourceSelector);
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const handleNetworkClick = useCallback(
    (networkId: string) => {
      const originalNetwork = availableNetworks.find(n =>
        n.type === "CryptoCurrency" ? n.id === networkId : n.parentCurrency.id === networkId,
      );
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
    [
      availableNetworks,
      trackModularDrawerEvent,
      flow,
      source,
      networksConfiguration,
      onNetworkSelected,
    ],
  );

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
    networksConfig: networksConfiguration,
  });

  const formattedNetworks = transformNetworks(availableNetworks);

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
        testID="modular-drawer-network-selection-scrollView"
      />
    </Flex>
  );
};

export default withDiscreetMode(React.memo(NetworkSelection));
