import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
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
import { BottomSheetFlatList, BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { createNetworkConfigurationHook } from "@ledgerhq/live-common/modularDrawer/modules/createNetworkConfiguration";
import { accountsCount } from "../../components/AccountCount";
import { accountsCountAndApy } from "../../components/AccountCountAndApy";
import { accountsApy } from "../../components/AccountApy";
import { balanceItem } from "../../components/Balance";
import { useAccountData } from "../../hooks/useAccountData";
import { useBalanceDeps } from "../../hooks/useBalanceDeps";
import { useSelector } from "~/context/hooks";
import { modularDrawerFlowSelector, modularDrawerSourceSelector } from "~/reducers/modularDrawer";
import { withDiscreetMode } from "~/context/DiscreetModeContext";

export type NetworkSelectionStepProps = {
  availableNetworks: CryptoOrTokenCurrency[];
  onNetworkSelected: (asset: CryptoOrTokenCurrency) => void;
  networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];
  useLumenBottomSheet?: boolean;
};

const SAFE_MARGIN_BOTTOM = 48;

const NetworkSelection = ({
  availableNetworks,
  onNetworkSelected,
  networksConfiguration,
  useLumenBottomSheet = false,
}: Readonly<NetworkSelectionStepProps>) => {
  const { t } = useTranslation();
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
      {useLumenBottomSheet && (
        <BottomSheetHeader spacing title={t("modularDrawer.selectNetwork")} appearance="expanded" />
      )}
      <BottomSheetFlatList
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        data={formattedNetworks}
        keyExtractor={keyExtractor}
        renderItem={({ item }: { item: NetworkType }) => (
          <NetworkItem {...item} onClick={() => handleNetworkClick(item.id)} />
        )}
        style={useLumenBottomSheet ? undefined : LEGACY_LIST_STYLE}
        contentContainerStyle={{
          paddingBottom: SAFE_MARGIN_BOTTOM,
        }}
        testID="modular-drawer-network-selection-scrollView"
      />
    </Flex>
  );
};

/**
 * Temporary: cancels QueuedDrawerGorhom's paddingHorizontal: 16 so list items
 * align with the header. Will be removed when Gorhom fallback is deleted.
 */
const LEGACY_LIST_STYLE = StyleSheet.create({
  list: { marginHorizontal: -16 },
}).list;

export default withDiscreetMode(React.memo(NetworkSelection));
