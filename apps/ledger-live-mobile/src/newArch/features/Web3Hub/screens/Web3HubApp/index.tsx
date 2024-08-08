import React, { ComponentProps, useCallback, useContext, useMemo, useRef } from "react";
// import { useAnimatedScrollHandler } from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import type { AppProps } from "LLM/features/Web3Hub/types";
import { HeaderContext } from "LLM/features/Web3Hub/HeaderContext";
import WebPlatformPlayer from "./components/Web3Player";
import GenericErrorView from "~/components/GenericErrorView";
import { useLocale } from "~/context/Locale";
import useWeb3HubAppViewModel from "./useWeb3HubAppViewModel";

const appManifestNotFoundError = new Error("App not found");

const clamp = (value: number, lowerBound: number, upperBound: number) => {
  "worklet";
  return Math.min(Math.max(lowerBound, value), upperBound);
};

type NoOptionals<T> = {
  [K in keyof T]-?: T[K];
};

const initialTimeoutRef = {
  prevY: 0,
  prevLayoutY: 0,
};

// TODO local manifests ?
export default function Web3HubApp({ route }: AppProps) {
  const { manifestId, queryParams } = route.params;
  const { theme } = useTheme();
  const { locale } = useLocale();
  const { layoutY } = useContext(HeaderContext);

  // const scrollHandler = useAnimatedScrollHandler<{ prevY: number; prevLayoutY: number }>({
  //   onScroll: (event, ctx) => {
  //     if (!layoutY) return;

  //     const diff = event.contentOffset.y - ctx.prevY;

  //     layoutY.value = clamp(ctx.prevLayoutY + diff, 0, 60);
  //   },
  //   onBeginDrag: (event, ctx) => {
  //     if (layoutY) {
  //       ctx.prevLayoutY = layoutY.value;
  //     }
  //     ctx.prevY = event.contentOffset.y;
  //   },
  // });

  // Trick until we can properly use reanimated with the webview
  const timeoutRef = useRef<{ timeout?: NodeJS.Timeout; prevY: number; prevLayoutY: number }>(
    initialTimeoutRef,
  );

  const onScroll = useCallback(
    (event: Parameters<NoOptionals<ComponentProps<typeof WebPlatformPlayer>>["onScroll"]>[0]) => {
      if (!layoutY) return;
      clearTimeout(timeoutRef.current.timeout);

      const currentY = event.nativeEvent.contentOffset.y;

      const diff = currentY - timeoutRef.current.prevY;
      layoutY.value = clamp(timeoutRef.current.prevLayoutY + diff, 0, 60);

      timeoutRef.current.timeout = setTimeout(() => {
        timeoutRef.current.prevY = currentY;
        timeoutRef.current.prevLayoutY = layoutY.value;
      }, 100);
    },
    [layoutY],
  );

  const { manifest, isLoading } = useWeb3HubAppViewModel(manifestId);

  const inputs = useMemo(() => {
    return {
      theme,
      lang: locale,
      ...queryParams,
    };
  }, [locale, queryParams, theme]);

  return manifest ? (
    <WebPlatformPlayer manifest={manifest} inputs={inputs} onScroll={onScroll} />
  ) : (
    <Flex flex={1} p={10} justifyContent="center" alignItems="center">
      {isLoading ? <InfiniteLoader /> : <GenericErrorView error={appManifestNotFoundError} />}
    </Flex>
  );
}
