import React, { useCallback, useMemo } from "react";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { NetworkRow, NetworkRowData } from "./components/NetworkRow";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import {
  useModularDrawerAnalytics,
  TrackDrawerScreen,
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
} from "../../analytics";
import { BottomSheetFlatList, BottomSheetHeader, Box } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { useNetworkConfiguration } from "@ledgerhq/live-common/modularDrawer/modules/createNetworkConfiguration";
import { accountsCount } from "../../components/AccountCount";
import { accountsCountAndApy } from "../../components/AccountCountAndApy";
import { ApyIndicator } from "../../components/ApyIndicator";
import { balanceItem } from "../../components/Balance";
import { useAccountData } from "../../hooks/useAccountData";
import { useBalanceDeps } from "../../hooks/useBalanceDeps";
import { useSelector } from "~/context/hooks";
import { modularDrawerFlowSelector, modularDrawerSourceSelector } from "~/reducers/modularDrawer";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { useAvailabilityRows } from "@ledgerhq/live-common/modularDrawer/hooks/useAvailabilityRows";
import type { AvailabilityRow } from "@ledgerhq/live-common/modularDrawer/utils/buildAvailabilityRows";
import type { DisabledItemExplanation, DisabledItemsExplanation } from "../../types";
import { UnavailableSectionHeader } from "../../components/UnavailableSectionHeader";

export type NetworkSelectionStepProps = {
  availableNetworks: CryptoOrTokenCurrency[];
  onNetworkSelected: (asset: CryptoOrTokenCurrency) => void;
  networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];
  selectableNetworkIds?: readonly string[];
  disabledNetworkExplanation?: DisabledItemsExplanation["network"];
  onDisabledNetworkPress?: (explanation: DisabledItemExplanation) => void;
  selectedAssetName?: string;
};

type NetworkListRow = AvailabilityRow<NetworkRowData>;

const SAFE_MARGIN_BOTTOM = 48;
const UNAVAILABLE_SECTION_HEADER_KEY = "unavailable-section-header";

const NetworkSelection = ({
  availableNetworks,
  onNetworkSelected,
  networksConfiguration,
  selectableNetworkIds,
  disabledNetworkExplanation,
  onDisabledNetworkPress,
  selectedAssetName,
}: Readonly<NetworkSelectionStepProps>) => {
  const { t } = useTranslation();
  const flow = useSelector(modularDrawerFlowSelector);
  const source = useSelector(modularDrawerSourceSelector);
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const selectableNetworkIdSet = useMemo(
    () => (selectableNetworkIds === undefined ? undefined : new Set(selectableNetworkIds)),
    [selectableNetworkIds],
  );

  const isSelectableNetwork = useCallback(
    (networkId: string) => {
      if (selectableNetworkIdSet === undefined) return true;

      return selectableNetworkIdSet.has(networkId);
    },
    [selectableNetworkIdSet],
  );

  const handleNetworkClick = useCallback(
    (networkId: string) => {
      if (!isSelectableNetwork(networkId)) return;
      const originalNetwork = availableNetworks.find(n =>
        n.type === "CryptoCurrency" ? n.id === networkId : n.parentCurrencyId === networkId,
      );
      if (originalNetwork) {
        trackModularDrawerEvent(
          EVENTS_NAME.NETWORK_CLICKED,
          {
            flow,
            source,
            network: getCryptoCurrencyById(networkId).name,
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
      isSelectableNetwork,
    ],
  );

  const formattedNetworks = useNetworkConfiguration(availableNetworks ?? [], {
    useAccountData,
    accountsCount,
    accountsCountAndApy,
    ApyIndicator,
    useBalanceDeps,
    balanceItem,
    ...networksConfiguration,
  });

  const isUnavailableNetwork = useCallback(
    (network: NetworkRowData) => !isSelectableNetwork(network.id),
    [isSelectableNetwork],
  );

  const networkRows = useAvailabilityRows(formattedNetworks, isUnavailableNetwork);

  const keyExtractor = useCallback(
    (row: NetworkListRow, index: number) =>
      row.kind === "item" ? `${row.item.id}-${index}` : UNAVAILABLE_SECTION_HEADER_KEY,
    [],
  );

  return (
    <Box lx={{ flexGrow: 1 }}>
      <TrackDrawerScreen
        page={EVENTS_NAME.MODULAR_NETWORK_SELECTION}
        flow={flow}
        source={source}
        networksConfig={networksConfiguration}
        formatNetworkConfig
      />
      <BottomSheetHeader spacing title={t("modularDrawer.selectNetwork")} density="expanded" />
      <BottomSheetFlatList
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        data={networkRows}
        keyExtractor={keyExtractor}
        renderItem={({ item: row }: { item: NetworkListRow }) => {
          if (row.kind === "unavailableSectionHeader") {
            return <UnavailableSectionHeader testID="modular-drawer-unavailable-networks-header" />;
          }

          const network = row.item;
          const isSelectable = isSelectableNetwork(network.id);

          return (
            <NetworkRow
              {...network}
              disabled={isSelectable ? undefined : true}
              onClick={() => handleNetworkClick(network.id)}
              disabledExplanation={
                !isSelectable && selectedAssetName
                  ? disabledNetworkExplanation?.(network.name, selectedAssetName)
                  : undefined
              }
              onDisabledPress={onDisabledNetworkPress}
            />
          );
        }}
        contentContainerStyle={{
          paddingBottom: SAFE_MARGIN_BOTTOM,
        }}
        testID="modular-drawer-network-selection-scrollView"
      />
    </Box>
  );
};

export default withDiscreetMode(React.memo(NetworkSelection));
