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
import { useTranslation } from "~/context/Locale";
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
  const [heightAdjustment, setHeightAdjustment] = useState(0);

  useEffect(() => setHasAnimated(true), []);

  useEffect(() => {
    return forceFabricLayoutRefresh(setHeightAdjustment);
  }, [showAssets, assetsLength, accountsLength]);

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
            key="assets-tab"
            entering={hasAnimated ? SlideInLeft.duration(ANIMATION_DURATION_MS) : undefined}
            exiting={hasAnimated ? SlideOutLeft.duration(ANIMATION_DURATION_MS) : undefined}
            style={{ height: assetsFullHeight + heightAdjustment }}
            collapsable={false}
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
            key="accounts-tab"
            entering={hasAnimated ? SlideInRight.duration(ANIMATION_DURATION_MS) : undefined}
            exiting={hasAnimated ? SlideOutRight.duration(ANIMATION_DURATION_MS) : undefined}
            style={{ height: accountsFullHeight + heightAdjustment }}
            collapsable={false}
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
  hasInitialized: React.RefObject<boolean>,
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
  hasInitialized: React.RefObject<boolean>,
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
  prevAssetsLength: React.RefObject<number>,
  prevAccountsLength: React.RefObject<number>,
  hasInitializedAssets: React.RefObject<boolean>,
  hasInitializedAccounts: React.RefObject<boolean>,
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

/**
 * RNNA-FIX: Workaround for a React Native Fabric hit testing cache issue.
 *
 * This helper forces a layout refresh by temporarily adjusting the list
 * container height. After the tab animation has finished, it nudges the
 * height by a small amount (to `1`), which invalidates Fabric's internal
 * hit-testing and layout cache, and then restores the height back to `0`
 * once the layout has had time to settle.
 *
 * The initial timeout is scheduled for `ANIMATION_DURATION_MS +
 * FABRIC_REFRESH_DELAY_BUFFER_MS`, ensuring the adjustment runs only after
 * the tab transition animation is expected to be fully complete, with a
 * small buffer to account for timing variance. The restoration timeout then
 * waits an additional `LAYOUT_SETTLE_DELAY_MS` so that the view hierarchy
 * can stabilize before resetting the adjustment back to its baseline.
 *
 * @param setHeightAdjustment
 * The state setter used to apply the temporary height adjustment.
 * Typically this is created with {@link React.useState} and controls an
 * extra height value applied to the container.
 *
 * @see https://github.com/LedgerHQ/ledger-live/pull/13892
 */
function forceFabricLayoutRefresh(
  setHeightAdjustment: React.Dispatch<React.SetStateAction<number>>,
) {
  let restorationTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutId = setTimeout(() => {
    setHeightAdjustment(1);
    restorationTimeoutId = setTimeout(() => setHeightAdjustment(0), LAYOUT_SETTLE_DELAY_MS);
  }, ANIMATION_DURATION_MS + FABRIC_REFRESH_DELAY_BUFFER_MS);
  return () => {
    clearTimeout(timeoutId);
    if (restorationTimeoutId) {
      clearTimeout(restorationTimeoutId);
    }
  };
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

/** Delay buffer in milliseconds for Fabric refresh */
const FABRIC_REFRESH_DELAY_BUFFER_MS = 50;

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
