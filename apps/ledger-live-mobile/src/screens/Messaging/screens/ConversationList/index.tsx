import React, { MutableRefObject, useCallback, useContext } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { Platform, RefreshControl, ViewToken } from "react-native";
import { TAB_BAR_SAFE_HEIGHT } from "~/components/TabBar/TabBarSafeAreaView";
import { useFocusEffect } from "@react-navigation/native";
import { AnalyticsContext } from "~/analytics/AnalyticsContext";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import WalletTabSafeAreaView from "~/components/WalletTab/WalletTabSafeAreaView";
import { useTheme } from "styled-components/native";
import SearchHeader from "./components/SearchHeader";
import ListFooter from "./components/ListFooter";
import ListEmpty from "./components/ListEmpty";
import ListRow from "./components/ListRow";
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";
import useConversationListViewModel from "./useConversationListViewModel";

const RefreshableCollapsibleHeaderFlatList = globalSyncRefreshControl(
  CollapsibleHeaderFlatList<Conversation>,
  {
    progressViewOffset: Platform.OS === "android" ? 64 : 0,
  },
);

const keyExtractor = (item: Conversation, index: number) => index.toString();

type Conversation = {
  name: string;
  id: string;
  messages: unknown[];
};

interface ViewProps {
  conversations?: Conversation[];
  search?: string;
  loading: boolean;
  refresh: () => void;
  onEndReached?: () => void;
  viewabilityConfigCallbackPairs: MutableRefObject<
    {
      onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => void;
      viewabilityConfig: {
        viewAreaCoveragePercentThreshold: number;
      };
    }[]
  >;
}

function View({
  conversations,
  search,
  loading,
  refresh,
  onEndReached,
  viewabilityConfigCallbackPairs,
}: ViewProps) {
  const { colors } = useTheme();

  const { setSource, setScreen } = useContext(AnalyticsContext);

  useFocusEffect(
    useCallback(() => {
      setScreen && setScreen("Market");

      return () => {
        setSource("Market");
      };
    }, [setScreen, setSource]),
  );

  const listProps = {
    contentContainerStyle: {
      paddingHorizontal: 16,
      paddingBottom: TAB_BAR_SAFE_HEIGHT,
    },
    data: conversations,
    renderItem: ({ item, index }: { item: Conversation; index: number }) => (
      <ListRow item={item} index={index} />
    ),
    onEndReached,
    maxToRenderPerBatch: 50,
    onEndReachedThreshold: 0.5,
    scrollEventThrottle: 50,
    initialNumToRender: 50,
    keyExtractor,
    viewabilityConfigCallbackPairs: viewabilityConfigCallbackPairs.current,
    ListFooterComponent: <ListFooter isLoading={loading} />,
    ListEmptyComponent: (
      <ListEmpty
        hasNoSearchResult={Boolean(conversations?.length === 0 && search && !loading)}
        search={search}
        resetSearch={() => {}}
      />
    ),
    refreshControl: (
      <RefreshControl
        refreshing={false}
        colors={[colors.primary.c80]}
        tintColor={colors.primary.c80}
        onRefresh={() => {}}
      />
    ),
  };

  return (
    <RefreshableCollapsibleHeaderFlatList
      {...listProps}
      stickyHeaderIndices={[0]}
      ListHeaderComponent={
        <WalletTabSafeAreaView edges={["left", "right"]}>
          <Flex backgroundColor={colors.background.main}>
            <SearchHeader search={search} refresh={refresh} />
          </Flex>
        </WalletTabSafeAreaView>
      }
    />
  );
}

const ConversationList = () => {
  const viewModel = useConversationListViewModel();
  return <View {...viewModel} search={viewModel.search ?? undefined} />;
};

export default ConversationList;
