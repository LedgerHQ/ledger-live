import React, { useState, useEffect } from "react";
import { Box, Button, TabSelector } from "@ledgerhq/native-ui";
import Animated, {
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
} from "react-native-reanimated";
import { AssetShortListView } from "LLM/features/Assets/components/AssetsShortListView";
import { AccountsShortListView } from "LLM/features/Accounts/components/AccountShortListView";
import { ScreenName } from "~/const";
import { GestureResponderEvent } from "react-native/Libraries/Types/CoreEventTypes";
import AddAccountButton from "LLM/features/Accounts/components/AddAccountButton";
import { useTranslation } from "~/context/Locale";

export default function TabSection({
  handleToggle,
  onPressButton,
  initialTab,
  showAssets,
  assetsLength,
  accountsLength,
  maxItemsToDisplay,
}: TabSectionProps) {
  const { t } = useTranslation();
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => setHasAnimated(true), []);

  return (
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
      <Box testID="portfolio-assets-layout">
        {showAssets ? (
          <Animated.View
            key="assets-tab"
            entering={hasAnimated ? SlideInLeft.duration(ANIMATION_DURATION_MS) : undefined}
            exiting={hasAnimated ? SlideOutLeft.duration(ANIMATION_DURATION_MS) : undefined}
            collapsable={false}
          >
            <AssetShortListView
              sourceScreenName={ScreenName.Portfolio}
              limitNumberOfAssets={maxItemsToDisplay}
            />
            {assetsLength >= maxItemsToDisplay && (
              <Box testID="assets-button">
                <Button type="shade" size="large" outline onPress={onPressButton}>
                  {t("portfolio.seeAllAssets")}
                </Button>
              </Box>
            )}
          </Animated.View>
        ) : (
          <Animated.View
            key="accounts-tab"
            entering={hasAnimated ? SlideInRight.duration(ANIMATION_DURATION_MS) : undefined}
            exiting={hasAnimated ? SlideOutRight.duration(ANIMATION_DURATION_MS) : undefined}
            collapsable={false}
          >
            <AccountsShortListView
              sourceScreenName={ScreenName.Portfolio}
              limitNumberOfAccounts={maxItemsToDisplay}
            />
            <Box testID="accounts-button">
              <AddAccountButton sourceScreenName="Wallet" />
              {accountsLength >= maxItemsToDisplay && (
                <Button
                  type="shade"
                  size="large"
                  outline
                  onPress={onPressButton}
                  testID="show-all-accounts-button"
                >
                  {t("portfolio.seeAllAccounts")}
                </Button>
              )}
            </Box>
          </Animated.View>
        )}
      </Box>
    </>
  );
}

/** Constant mapping for the tab options */
export const TAB_OPTIONS = {
  Assets: "Assets",
  Accounts: "Accounts",
} as const;
export type TabListType = (typeof TAB_OPTIONS)[keyof typeof TAB_OPTIONS];

/** Animation duration in milliseconds */
const ANIMATION_DURATION_MS = 250;

/** Props for the {@link TabSection} component */
type TabSectionProps = {
  handleToggle: (value: TabListType) => void;
  onPressButton: (uiEvent: GestureResponderEvent) => void;
  initialTab: TabListType;
  showAssets: boolean;
  assetsLength: number;
  accountsLength: number;
  maxItemsToDisplay: number;
};
