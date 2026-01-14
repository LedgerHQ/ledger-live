import { useState } from "react";
import { TAB_OPTIONS } from "./TabSection";
import { LayoutChangeEvent } from "react-native/Libraries/Types/CoreEventTypes";

export type TabListType = (typeof TAB_OPTIONS)[keyof typeof TAB_OPTIONS];

/**
 * Default height for the lists and buttons. Set to ~400px which is approximately the max height
 * for the limited list display. This allows content to render immediately without timing issues.
 */
export const DEFAULT_HEIGHT = 400;

/**
 * Hook to manage height calculations for the portfolio tabs animation.
 * Tab state management is handled by the parent component (PortfolioAssets).
 *
 * @param selectedTab - The currently selected tab (controlled by parent)
 */
const useListsAnimation = (selectedTab: TabListType) => {
  const [assetsHeight, setAssetsHeight] = useState<number>(DEFAULT_HEIGHT);
  const [accountsHeight, setAccountsHeight] = useState<number>(DEFAULT_HEIGHT);
  const [accountsButtonHeight, setAccountsButtonHeight] = useState<number>(0);
  const [assetsButtonHeight, setAssetsButtonHeight] = useState<number>(0);

  const handleButtonLayout = (tab: TabListType, event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height === 0) return;
    if (tab === TAB_OPTIONS.Assets) setAssetsButtonHeight(height);
    else setAccountsButtonHeight(height);
  };

  const handleAssetsContentSizeChange = (_width: number, height: number) => {
    if (height > 0) {
      setAssetsHeight(height);
    }
  };

  const handleAccountsContentSizeChange = (_width: number, height: number) => {
    if (height > 0) {
      setAccountsHeight(height);
    }
  };

  // Calculate the current height based on selected tab
  const currentHeight =
    selectedTab === TAB_OPTIONS.Assets
      ? assetsHeight + assetsButtonHeight
      : accountsHeight + accountsButtonHeight;

  // Pre-calculated heights for each tab
  const assetsFullHeight = assetsHeight + assetsButtonHeight;
  const accountsFullHeight = accountsHeight + accountsButtonHeight;

  return {
    handleButtonLayout,
    handleAssetsContentSizeChange,
    handleAccountsContentSizeChange,
    currentHeight,
    assetsFullHeight,
    accountsFullHeight,
  };
};

export default useListsAnimation;
