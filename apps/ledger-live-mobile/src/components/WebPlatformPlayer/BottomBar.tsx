import React, { RefObject, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import {
  ArrowLeftMedium,
  ArrowRightMedium,
  ReverseMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { useTheme } from "styled-components/native";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";

type BottomBarProps = {
  manifest: AppManifest;
  webviewAPIRef: RefObject<WebviewAPI>;
  webviewState: WebviewState;
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
      <Flex
        justifyContent="center"
        alignItems="center"
        height={40}
        width={40}
        {...flexProps}
      >
        {children}
      </Flex>
    </TouchableOpacity>
  );
}

export function BottomBar({ webviewAPIRef, webviewState }: BottomBarProps) {
  const { colors } = useTheme();

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

    webview.reload();
  }, [webviewAPIRef]);

  return (
    <Flex flexDirection="row" paddingY={4} paddingX={4}>
      <Flex flexDirection="row" flex={1}>
        <IconButton
          onPress={handleBack}
          marginRight={4}
          disabled={!webviewState.canGoBack}
        >
          <ArrowLeftMedium
            size={24}
            color={
              webviewState.canGoBack ? colors.neutral.c100 : colors.neutral.c50
            }
          />
        </IconButton>

        <IconButton
          onPress={handleForward}
          disabled={!webviewState.canGoForward}
        >
          <ArrowRightMedium
            size={24}
            color={
              webviewState.canGoForward
                ? colors.neutral.c100
                : colors.neutral.c50
            }
          />
        </IconButton>
      </Flex>

      <IconButton onPress={handleReload} alignSelf="flex-end">
        <ReverseMedium size={24} color="neutral.c100" />
      </IconButton>
    </Flex>
  );
}
