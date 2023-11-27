import React, { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { Edge, useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: readonly Edge[] | undefined;
  isFlex?: boolean;
} & ViewProps;

/**
 * [SafeAreaProvider](https://github.com/th3rdwave/react-native-safe-area-context#safeareaprovider) should still be higher in the tree.
 *
 * GitHub issues:
 * [219](https://github.com/th3rdwave/react-native-safe-area-context/issues/219),
 * [226](https://github.com/th3rdwave/react-native-safe-area-context/issues/226)
 */
export default function SafeAreaViewFixed({ children, style, edges, isFlex, ...rest }: Props) {
  const insets = useSafeAreaInsets();
  const defaultEdges = edges === undefined;
  return (
    <View
      style={StyleSheet.compose(
        {
          paddingTop: defaultEdges || edges?.includes("top") ? insets.top : undefined,
          paddingBottom: defaultEdges || edges?.includes("bottom") ? insets.bottom : undefined,
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
