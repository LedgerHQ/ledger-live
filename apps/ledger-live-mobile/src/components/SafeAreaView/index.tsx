import React, { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { Edge, EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";

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
  const computedPaddingBottom = computePaddingBottom(edges, useDetoxInsets, insets);
  const defaultEdges = isDefaultEdges(edges);

  return (
    <View
      style={StyleSheet.compose(
        {
          paddingTop: defaultEdges || edges?.includes("top") ? insets.top : undefined,
          paddingBottom: computedPaddingBottom,
          paddingLeft: defaultEdges || edges?.includes("left") ? insets.left : undefined,
          paddingRight: defaultEdges || edges?.includes("right") ? insets.right : undefined,
          flex: isFlex ? 1 : 0,
        },
        style,
      )}
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
