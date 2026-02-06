import React, { useCallback } from "react";
import { View } from "react-native";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { CryptoIcon, Network as NetworkType } from "@ledgerhq/native-ui/lib/pre-ldls/index";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import {
  useModularDrawerAnalytics,
  TrackDrawerScreen,
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
} from "../../analytics";
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
import {
  BottomSheetFlatList,
  ListItem,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

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

  const styles = useStyleSheet(
    theme => ({
      infoWrapper: {
        rowGap: theme.spacings.s4,
        marginLeft: theme.spacings.s8,
        flex: 1,
      },
      leftElementWrapper: {
        flexDirection: "row",
        gap: theme.spacings.s4,
      },
    }),
    [],
  );

  const keyExtractor = useCallback((item: NetworkType, index: number) => `${item.id}-${index}`, []);

  const renderItem = useCallback(
    ({ item }: { item: NetworkType }) => (
      <ListItem onPress={() => handleNetworkClick(item.id)}>
        <ListItemLeading lx={{ flex: 0 }}>
          <CryptoIcon overridesRadius={16} size={48} ledgerId={item.id} ticker={item.ticker} />
        </ListItemLeading>
        <View style={styles.infoWrapper}>
          <ListItemTitle>{item.name}</ListItemTitle>
          {item.leftElement && <View style={styles.leftElementWrapper}>{item.leftElement}</View>}
        </View>
        <ListItemTrailing>{item.rightElement}</ListItemTrailing>
      </ListItem>
    ),
    [styles.infoWrapper, styles.leftElementWrapper, handleNetworkClick],
  );

  return (
    <>
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
        renderItem={renderItem}
        contentContainerStyle={{
          paddingBottom: SAFE_MARGIN_BOTTOM,
          marginTop: 16,
        }}
        testID="modular-drawer-network-selection-scrollView"
      />
    </>
  );
};

export default withDiscreetMode(React.memo(NetworkSelection));
