import React, { memo } from "react";
import { Box, Button, Flex } from "@ledgerhq/native-ui";
import Animated from "react-native-reanimated";
import { TabSelector } from "@ledgerhq/native-ui";
import AssetsListView from "LLM/features/Assets/components/AssetsListView";
import AccountsListView from "LLM/features/Accounts/components/AccountsListView";
import { ScreenName } from "~/const";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
} from "react-native/Libraries/Types/CoreEventTypes";
import AddAccountButton from "LLM/features/Accounts/components/AddAccountButton";
import { type TabListType } from "./useListsAnimation";

export const TAB_OPTIONS = {
  Assets: "Assets",
  Accounts: "Accounts",
} as const;

type BaseAnimationStyle = {
  transform: {
    translateX: number;
  }[];
  opacity: number;
};

type TabSectionProps = {
  t: (key: string) => string;
  handleToggle: (value: TabListType) => void;
  handleLayout: (event: LayoutChangeEvent) => void;
  handleAssetsContentSizeChange: (width: number, height: number) => void;
  handleAccountsContentSizeChange: (width: number, height: number) => void;
  handleButtonLayout: (tab: TabListType, event: LayoutChangeEvent) => void;
  onPressButton: (uiEvent: GestureResponderEvent) => void;
  initialTab: TabListType;
  showAssets: boolean;
  assetsLength: number;
  showAccounts: boolean;
  accountsLength: number;
  assetsAnimatedStyle: BaseAnimationStyle;
  accountsAnimatedStyle: BaseAnimationStyle;
  containerHeight: number;
  maxItemsToDysplay: number;
};

const TabSection: React.FC<TabSectionProps> = ({
  t,
  handleToggle,
  handleLayout,
  handleAssetsContentSizeChange,
  handleAccountsContentSizeChange,
  handleButtonLayout,
  onPressButton,
  initialTab,
  showAssets,
  assetsLength,
  showAccounts,
  accountsLength,
  assetsAnimatedStyle,
  accountsAnimatedStyle,
  containerHeight,
  maxItemsToDysplay,
}) => (
  <>
    <Box height={40} mb={16}>
      <TabSelector
        labels={[
          { id: TAB_OPTIONS.Assets, value: t("assets.title") },
          { id: TAB_OPTIONS.Accounts, value: t("accounts.title") },
        ]}
        onToggle={handleToggle}
        initialTab={initialTab}
      />
    </Box>
    <Flex
      flexDirection="row"
      overflow="hidden"
      onLayout={handleLayout}
      width="200%"
      testID="portfolio-assets-layout"
      height={containerHeight}
      maxHeight={containerHeight}
      overflowY="hidden"
    >
      <Animated.View style={[{ flex: 1 }, assetsAnimatedStyle]}>
        <AssetsListView
          sourceScreenName={ScreenName.Portfolio}
          limitNumberOfAssets={maxItemsToDysplay}
          onContentChange={handleAssetsContentSizeChange}
        />
        {assetsLength >= maxItemsToDysplay && showAssets && (
          <Box
            onLayout={event => handleButtonLayout(TAB_OPTIONS.Assets, event)}
            testID="assets-button"
          >
            <Button type="shade" size="large" outline onPress={onPressButton}>
              {t("portfolio.seeAllAssets")}
            </Button>
          </Box>
        )}
      </Animated.View>
      <Animated.View style={[{ flex: 1 }, accountsAnimatedStyle]}>
        <AccountsListView
          sourceScreenName={ScreenName.Portfolio}
          limitNumberOfAccounts={maxItemsToDysplay}
          onContentChange={handleAccountsContentSizeChange}
        />
        {showAccounts && (
          <Box
            onLayout={event => handleButtonLayout(TAB_OPTIONS.Accounts, event)}
            testID="accounts-button"
          >
            <AddAccountButton sourceScreenName="Wallet" />
            {accountsLength >= maxItemsToDysplay && (
              <Button type="shade" size="large" outline onPress={onPressButton}>
                {t("portfolio.seeAllAccounts")}
              </Button>
            )}
          </Box>
        )}
      </Animated.View>
    </Flex>
  </>
);

export default memo(TabSection);
