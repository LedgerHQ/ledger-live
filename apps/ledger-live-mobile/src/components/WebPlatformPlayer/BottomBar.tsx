import React, { RefObject, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { ArrowLeftMedium, ArrowRightMedium, ReverseMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTheme } from "styled-components/native";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { safeGetRefValue, CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";
import SelectAccountButton from "./SelectAccountButton";

type BottomBarProps = {
  manifest: AppManifest;
  webviewAPIRef: RefObject<WebviewAPI>;
  webviewState: WebviewState;
  currentAccountHistDb: CurrentAccountHistDB;
};

function IconButton({
  children,
  onPress,
  disabled,
  ...flexProps
}: React.PropsWithChildren<
  {
    children: React.ReactNode;
    disabled?: boolean;
    onPress: () => void;
  } & React.ComponentProps<typeof Flex>
>) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Flex justifyContent="center" alignItems="center" height={40} width={40} {...flexProps}>
        {children}
      </Flex>
    </TouchableOpacity>
  );
}

export function BottomBar({
  manifest,
  webviewAPIRef,
  webviewState,
  currentAccountHistDb,
}: BottomBarProps) {
  const { colors } = useTheme();
  const shouldDisplaySelectAccount = !!manifest.dapp;

  const handleForward = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.goForward();
  }, [webviewAPIRef]);

  const handleBack = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.goBack();
  }, [webviewAPIRef]);

  const handleReload = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    console.log("bottom bar reload")
    webview.reload();
  }, [webviewAPIRef]);

  return (
    <Flex flexDirection="row" paddingY={4} paddingX={4} alignItems="center">
      <Flex flexDirection="row" flex={1}>
        <IconButton onPress={handleBack} marginRight={4} disabled={!webviewState.canGoBack}>
          <ArrowLeftMedium
            size={24}
            color={webviewState.canGoBack ? colors.neutral.c100 : colors.neutral.c50}
          />
        </IconButton>

        <IconButton onPress={handleForward} disabled={!webviewState.canGoForward}>
          <ArrowRightMedium
            size={24}
            color={webviewState.canGoForward ? colors.neutral.c100 : colors.neutral.c50}
          />
        </IconButton>
      </Flex>

      {shouldDisplaySelectAccount ? (
        <SelectAccountButton manifest={manifest} currentAccountHistDb={currentAccountHistDb} />
      ) : null}

      <IconButton onPress={handleReload} alignSelf="flex-end">
        <ReverseMedium size={24} color="neutral.c100" />
      </IconButton>
    </Flex>
  );
}
