import React, { memo } from "react";
import { Box, Flex } from "@ledgerhq/native-ui";
import Animated from "react-native-reanimated";
import { TabSelector } from "@ledgerhq/native-ui";
import AssetsListView from "LLM/features/Assets/components/AssetsListView";
import AccountsListView from "LLM/features/Accounts/components/AccountsListView";
import { ScreenName } from "~/const";
import { LayoutChangeEvent } from "react-native";

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
  handleToggle: (value: string) => void;
  handleLayout: (event: LayoutChangeEvent) => void;
  assetsAnimatedStyle: BaseAnimationStyle;
  accountsAnimatedStyle: BaseAnimationStyle;
  maxItemsToDysplay: number;
};

const TabSection: React.FC<TabSectionProps> = ({
  t,
  handleToggle,
  handleLayout,
  assetsAnimatedStyle,
  accountsAnimatedStyle,
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
      />
    </Box>
    <Flex
      flexDirection="row"
      overflow="hidden"
      onLayout={handleLayout}
      width="200%"
      testID="portfolio-assets-layout"
    >
      <Animated.View style={[{ flex: 1 }, assetsAnimatedStyle]}>
        <AssetsListView
          sourceScreenName={ScreenName.Portfolio}
          limitNumberOfAssets={maxItemsToDysplay}
        />
      </Animated.View>
      <Animated.View style={[{ flex: 1 }, accountsAnimatedStyle]}>
        <AccountsListView
          sourceScreenName={ScreenName.Portfolio}
          limitNumberOfAccounts={maxItemsToDysplay}
        />
      </Animated.View>
    </Flex>
  </>
);

export default memo(TabSection);
