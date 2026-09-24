import React, { createContext, useContext, useMemo } from "react";
import { useSharedValue, type SharedValue } from "react-native-reanimated";

export const WALLET_TAB_HEADER_HEIGHT = 48;
export const WALLET_TAB_BAR_HEIGHT = 56;

interface WalletNavScrollContextData {
  /** Undefined outside WalletTabNavigatorScrollManager. */
  scrollY?: SharedValue<number>;
}

const WalletNavScrollContext = createContext<WalletNavScrollContextData>({});

export const useWalletNavScrollContext = () => useContext(WalletNavScrollContext);

export default function WalletTabNavigatorScrollManager({
  children,
}: {
  children: React.ReactNode;
}) {
  const scrollY = useSharedValue(0);
  const value = useMemo(() => ({ scrollY }), [scrollY]);

  return (
    <WalletNavScrollContext.Provider value={value}>{children}</WalletNavScrollContext.Provider>
  );
}
