import React, { useState, useEffect, useRef } from "react";
import { Box, Button, TabSelector } from "@ledgerhq/native-ui";
import Animated, {
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
} from "react-native-reanimated";
import AssetsListView from "LLM/features/Assets/components/AssetsListView";
import AccountsListView from "LLM/features/Accounts/components/AccountsListView";
import { ScreenName } from "~/const";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
} from "react-native/Libraries/Types/CoreEventTypes";
import AddAccountButton from "LLM/features/Accounts/components/AddAccountButton";
import { type TabListType } from "./useListsAnimation";
import { useTranslation } from "react-i18next";
import { DEFAULT_HEIGHT } from "./useListsAnimation";

export default function TabSection({
  handleToggle,
  handleAssetsContentSizeChange,
  handleAccountsContentSizeChange,
  handleButtonLayout,
  onPressButton,
  initialTab,
  showAssets,
  assetsLength,
  accountsLength,
  assetsFullHeight,
  accountsFullHeight,
  maxItemsToDisplay,
}: TabSectionProps) {
  const { t } = useTranslation();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [displayHeight, setDisplayHeight] = useState(
    showAssets ? assetsFullHeight : accountsFullHeight,
  );
  const hasInitializedAssets = useRef(false);
  const hasInitializedAccounts = useRef(false);
  const prevAssetsLength = useRef(assetsLength);
  const prevAccountsLength = useRef(accountsLength);

  useEffect(() => setHasAnimated(true), []);

  useEffect(() => {
    resetInitializationOnDataChange(
      assetsLength,
      accountsLength,
      prevAssetsLength,
      prevAccountsLength,
      hasInitializedAssets,
      hasInitializedAccounts,
    );
  }, [assetsLength, accountsLength]);

  useEffect(() => {
    if (!hasInitializedAssets.current && showAssets) {
      return handleFirstRenderFrameAnimation(
        hasInitializedAssets,
        setDisplayHeight,
        assetsFullHeight,
      );
    }
  }, [showAssets, assetsFullHeight]);

  useEffect(() => {
    if (!hasInitializedAccounts.current && !showAssets) {
      return handleFirstRenderFrameAnimation(
        hasInitializedAccounts,
        setDisplayHeight,
        accountsFullHeight,
      );
    }
  }, [showAssets, accountsFullHeight]);

  useEffect(() => {
    return handleTabChangeHeight(
      showAssets,
      assetsFullHeight,
      accountsFullHeight,
      setDisplayHeight,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAssets]); // IMPORTANT: Only on tab change, not on height changes
  return (
    <>
      <Box height={40} mb={16}>
        <TabSelector
          key={initialTab} // Force remount when initialTab changes to sync internal state
          labels={[
            { id: TAB_OPTIONS.Assets, value: t("assets.title") },
            { id: TAB_OPTIONS.Accounts, value: t("accounts.title") },
          ]}
          onToggle={handleToggle}
          initialTab={initialTab}
        />
      </Box>
      <Box testID="portfolio-assets-layout" minHeight={displayHeight}>
        {showAssets ? (
          <Animated.View
            key="assets-view"
            entering={hasAnimated ? SlideInLeft.duration(ANIMATION_DURATION_MS) : undefined}
            exiting={hasAnimated ? SlideOutLeft.duration(ANIMATION_DURATION_MS) : undefined}
            style={{ height: assetsFullHeight }}
          >
            <AssetsListView
              sourceScreenName={ScreenName.Portfolio}
              limitNumberOfAssets={maxItemsToDisplay}
              onContentChange={handleAssetsContentSizeChange}
            />
            {assetsLength >= maxItemsToDisplay && (
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
        ) : (
          <Animated.View
            key="accounts-view"
            entering={hasAnimated ? SlideInRight.duration(ANIMATION_DURATION_MS) : undefined}
            exiting={hasAnimated ? SlideOutRight.duration(ANIMATION_DURATION_MS) : undefined}
            style={{ height: accountsFullHeight }}
          >
            <AccountsListView
              sourceScreenName={ScreenName.Portfolio}
              limitNumberOfAccounts={maxItemsToDisplay}
              onContentChange={handleAccountsContentSizeChange}
            />
            <Box
              onLayout={event => handleButtonLayout(TAB_OPTIONS.Accounts, event)}
              testID="accounts-button"
            >
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

/**
 * Handle display height update on tab change. Sets the height immediately to avoid bouncing,
 * then applies a +1px fix after a delay to workaround Fabric async rendering issues.
 *
 * @param showAssets
 * Whether the assets tab is currently shown
 * @param assetsFullHeight
 * Full height of the assets tab
 * @param accountsFullHeight
 * Full height of the accounts tab
 * @param setDisplayHeight
 * State setter for display height
 * @returns
 * Cleanup function to clear the timeout
 */
function handleTabChangeHeight(
  showAssets: boolean,
  assetsFullHeight: number,
  accountsFullHeight: number,
  setDisplayHeight: React.Dispatch<React.SetStateAction<number>>,
) {
  const targetHeight = showAssets ? assetsFullHeight : accountsFullHeight;
  // Immediate update to avoid animation bouncing effect
  setDisplayHeight(targetHeight);

  // RNNA-FIX: Additional render to enforce clipping behavior to workaround Fabric rendering issues
  const timeoutId = setTimeout(() => setDisplayHeight(targetHeight + 1), LAYOUT_SETTLE_DELAY_MS);
  return () => clearTimeout(timeoutId);
}

/**
 * Handle the first render frame animation by setting the display height to the full height
 * after a short delay to allow layout to settle.
 *
 * RNNA-FIX: Delay for layout to settle and workaround Fabric async rendering issues.
 *
 * @param hasInitialized
 * The ref object to track if the animation has been completed
 * @param setDisplayHeight
 * The function to set the display height
 * @param fullHeight
 * The full height of the container
 */
function handleFirstRenderFrameAnimation(
  hasInitialized: React.MutableRefObject<boolean>,
  setDisplayHeight: React.Dispatch<React.SetStateAction<number>>,
  fullHeight: number,
) {
  // RNNA-FIX: Delay for layout to settle in production builds
  //           RAF fires too early on production builds
  const timeoutId = setTimeout(() => {
    completeFirstRenderAnimation(hasInitialized, setDisplayHeight, fullHeight);
  }, LAYOUT_SETTLE_DELAY_MS);
  return () => clearTimeout(timeoutId);
}

/**
 * Complete the first render animation by setting the display height to the full height
 *
 * @param hasInitialized
 * The ref object to track if the animation has been completed
 * @param setDisplayHeight
 * The function to set the display height
 * @param fullHeight
 * The full height of the container
 */
function completeFirstRenderAnimation(
  hasInitialized: React.MutableRefObject<boolean>,
  setDisplayHeight: React.Dispatch<React.SetStateAction<number>>,
  fullHeight: number,
) {
  // Only mark as initialized when we have a real height (not the default 1px)
  // This ensures the effect will run again when actual height is measured
  if (fullHeight > DEFAULT_HEIGHT) {
    hasInitialized.current = true;
  }
  setDisplayHeight(fullHeight);
}

/**
 * Reset initialization refs when data changes (new assets/accounts added).
 * This ensures proper re-rendering after navigation back with new data.
 *
 * @param assetsLength
 * Current number of assets
 * @param accountsLength
 * Current number of accounts
 * @param prevAssetsLength
 * Ref tracking previous assets count
 * @param prevAccountsLength
 * Ref tracking previous accounts count
 * @param hasInitializedAssets
 * Ref tracking if assets tab has been initialized
 * @param hasInitializedAccounts
 * Ref tracking if accounts tab has been initialized
 */
function resetInitializationOnDataChange(
  assetsLength: number,
  accountsLength: number,
  prevAssetsLength: React.MutableRefObject<number>,
  prevAccountsLength: React.MutableRefObject<number>,
  hasInitializedAssets: React.MutableRefObject<boolean>,
  hasInitializedAccounts: React.MutableRefObject<boolean>,
) {
  if (assetsLength !== prevAssetsLength.current) {
    prevAssetsLength.current = assetsLength;
    hasInitializedAssets.current = false;
  }
  if (accountsLength !== prevAccountsLength.current) {
    prevAccountsLength.current = accountsLength;
    hasInitializedAccounts.current = false;
  }
}

/** Constant mapping for the tab options */
export const TAB_OPTIONS = {
  Assets: "Assets",
  Accounts: "Accounts",
} as const;

/** Delay for layout to settle in production builds in milliseconds */
const LAYOUT_SETTLE_DELAY_MS = 100;

/** Animation duration in milliseconds */
const ANIMATION_DURATION_MS = 250;

/** Props for the {@link TabSection} component */
type TabSectionProps = {
  handleToggle: (value: TabListType) => void;
  handleAssetsContentSizeChange: (width: number, height: number) => void;
  handleAccountsContentSizeChange: (width: number, height: number) => void;
  handleButtonLayout: (tab: TabListType, event: LayoutChangeEvent) => void;
  onPressButton: (uiEvent: GestureResponderEvent) => void;
  initialTab: TabListType;
  showAssets: boolean;
  assetsLength: number;
  accountsLength: number;
  assetsFullHeight: number;
  accountsFullHeight: number;
  maxItemsToDisplay: number;
};
