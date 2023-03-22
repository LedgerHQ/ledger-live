import React from "react";
import { TouchableOpacity } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import WebView from "react-native-webview";
import {
  ArrowLeftMedium,
  ArrowRightMedium,
  ReverseMedium,
} from "@ledgerhq/native-ui/assets/icons";

export function BottomNav({
  navState,
  goBack,
  goForward,
  navColors,
  onReload,
}: {
  navState: {
    canGoBack: boolean;
    canGoForward: boolean;
  };
  goBack: WebView["goBack"];
  goForward: WebView["goForward"];
  navColors: {
    goBack: string;
    goForward: string;
  };
  onReload: () => void;
}) {
  return (
    <Flex flexDirection="row" paddingY={4} paddingX={4}>
      <Flex flexDirection="row" flex={1}>
        <IconButton
          onPress={goBack}
          marginRight={4}
          disabled={!navState.canGoBack}
        >
          <ArrowLeftMedium size={24} color={navColors.goBack} />
        </IconButton>

        <IconButton onPress={goForward} disabled={!navState.canGoForward}>
          <ArrowRightMedium size={24} color={navColors.goForward} />
        </IconButton>
      </Flex>

      <IconButton onPress={onReload} alignSelf="flex-end">
        <ReverseMedium size={24} color="neutral.c100" />
      </IconButton>
    </Flex>
  );
}

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
