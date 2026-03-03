import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SwapOpaqueHeader } from "./SwapOpaqueHeader";
import { SwapTopBarHeader } from "./SwapTopBarHeader";
import { useSwapWallet40HeaderState } from "../navigationHandlers/wallet40/useSwapWallet40HeaderState";

export function SwapWallet40Header() {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const headerState = useSwapWallet40HeaderState();

  const onBackPress = useCallback(() => {
    if (headerState.canGoBack) {
      headerState.goBackWebview?.();
      return;
    }

    navigation.goBack();
  }, [headerState, navigation]);

  if (headerState.headerStyle === "transparent") {
    return <SwapTopBarHeader />;
  }

  return <SwapOpaqueHeader onBackPress={onBackPress} titleKey={headerState.titleKey} />;
}
