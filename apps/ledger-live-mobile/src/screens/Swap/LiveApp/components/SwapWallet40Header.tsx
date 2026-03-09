import React, { useCallback } from "react";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SwapOpaqueHeader } from "./SwapOpaqueHeader";
import { SwapTopBarHeader } from "./SwapTopBarHeader";
import { useSwapWallet40HeaderState } from "../navigationHandlers/wallet40/useSwapWallet40HeaderState";
import { NavigatorName } from "~/const";

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

  const onClosePress = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: NavigatorName.Swap }],
      }),
    );
  }, [navigation]);

  if (headerState.headerStyle === "transparent") {
    return <SwapTopBarHeader />;
  }

  return (
    <SwapOpaqueHeader
      onBackPress={onBackPress}
      onClosePress={headerState.isTransactionComplete ? onClosePress : undefined}
      showBackButton={!headerState.isTransactionComplete}
      titleKey={headerState.titleKey}
    />
  );
}
