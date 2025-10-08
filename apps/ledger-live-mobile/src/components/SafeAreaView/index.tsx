import React, { ReactNode, useState, useCallback, useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle, LayoutChangeEvent } from "react-native";
import { Edge, EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { useExperimental } from "~/experimental";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: readonly Edge[] | undefined;
  isFlex?: boolean;
  /**
   * When using detox it adds a global header height to the insets resulting bottom buttons
   * not being visible even for the test runner, this is used to compensate for that
   */
  useDetoxInsets?: boolean;
} & ViewProps;

/**
 * [SafeAreaProvider](https://github.com/th3rdwave/react-native-safe-area-context#safeareaprovider) should still be higher in the tree.
 *
 * GitHub issues:
 * [219](https://github.com/th3rdwave/react-native-safe-area-context/issues/219),
 * [226](https://github.com/th3rdwave/react-native-safe-area-context/issues/226)
 */
export default function SafeAreaViewFixed({
  children,
  style,
  edges,
  isFlex,
  useDetoxInsets,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();
  const hasExperimentalHeader = useExperimental();
  const computedPaddingBottom = computePaddingBottom(edges, useDetoxInsets, insets);
  const defaultEdges = isDefaultEdges(edges);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  // When experimental header is enabled, don't add top padding as the header handles positioning
  const shouldApplyTopPadding = (defaultEdges || edges?.includes("top")) && !hasExperimentalHeader;

  const paddingTop = shouldApplyTopPadding ? insets.top : 0;
  const paddingBottom = computedPaddingBottom || 0;
  const paddingLeft = defaultEdges || edges?.includes("left") ? insets.left : 0;
  const paddingRight = defaultEdges || edges?.includes("right") ? insets.right : 0;

  // RNNA FIX: On Android, the SafeAreaView is not always the same height as the screen, so we need
  // to measure it and use it to calculate the max height. As soon as we have a proper fix from RN,
  // we can remove this with `measuredHeight` and `calculatedMaxHeight` variables.
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      if (isFlex && height > 0 && !measuredHeight) {
        setMeasuredHeight(height);
      }
    },
    [isFlex, measuredHeight],
  );

  // Calculate the max height to prevent overflow while allowing flex to work normally
  const calculatedMaxHeight = useMemo(() => {
    return isFlex && measuredHeight ? measuredHeight : undefined;
  }, [isFlex, measuredHeight]);

  return (
    <View
      style={StyleSheet.compose(
        {
          paddingTop: paddingTop || undefined,
          paddingBottom: paddingBottom || undefined,
          paddingLeft: paddingLeft || undefined,
          paddingRight: paddingRight || undefined,
          maxHeight: calculatedMaxHeight,
          flex: isFlex ? 1 : 0,
        },
        style,
      )}
      onLayout={isFlex ? handleLayout : undefined}
      {...rest}
    >
      {children}
    </View>
  );
}

function computePaddingBottom(
  edges: readonly Edge[] | undefined,
  useDetoxInsets: boolean | undefined,
  insets: EdgeInsets,
) {
  if (isDefaultEdges(edges) || edges?.includes("bottom")) {
    if (useDetoxInsets) {
      return insets.bottom * 2;
    } else {
      return insets.bottom;
    }
  } else {
    return undefined;
  }
}

function isDefaultEdges(edges: readonly Edge[] | undefined) {
  return edges === undefined;
}
