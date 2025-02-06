import semver from "semver";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import React, { forwardRef } from "react";
import { WalletAPIWebview } from "./WalletAPIWebview";
import { PlatformAPIWebview } from "./PlatformAPIWebview";
import { WebviewAPI, WebviewProps } from "./types";
import {
  HandlerStateChangeEvent,
  PanGestureHandler,
  PanGestureHandlerEventPayload,
  State,
} from "react-native-gesture-handler";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/core";

export const Web3AppWebview = forwardRef<WebviewAPI, WebviewProps>(
  (
    {
      manifest,
      currentAccountHistDb,
      inputs,
      customHandlers,
      onStateChange,
      allowsBackForwardNavigationGestures,
      onScroll,
    },
    ref,
  ) => {
    const navigation = useNavigation();

    const onGesture = (event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
      // PanGestureHandler callback for swiping left to right to fix issue with <Tab.Navigator>
      if (event.nativeEvent.state === State.END && event.nativeEvent.translationX > 10) {
        navigation.goBack();
      }
    };

    if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
      return (
        <PanGestureHandler onHandlerStateChange={onGesture} activeOffsetX={[0, 10]}>
          <View style={{ flex: 1 }}>
            <WalletAPIWebview
              ref={ref}
              onScroll={onScroll}
              manifest={manifest}
              currentAccountHistDb={currentAccountHistDb}
              inputs={inputs}
              customHandlers={customHandlers}
              onStateChange={onStateChange}
              allowsBackForwardNavigationGestures={allowsBackForwardNavigationGestures}
            />
          </View>
        </PanGestureHandler>
      );
    }
    return (
      <PlatformAPIWebview
        ref={ref}
        onScroll={onScroll}
        currentAccountHistDb={currentAccountHistDb}
        manifest={manifest}
        inputs={inputs}
        onStateChange={onStateChange}
      />
    );
  },
);

Web3AppWebview.displayName = "Web3AppWebview";
