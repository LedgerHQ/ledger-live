import React from "react";
import { View, StyleSheet } from "react-native";
import HeaderTitle from "~/components/HeaderTitle";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExperimental } from "~/experimental";

const NAVIGATION_HEADER_HEIGHT = 56;

/**
 * Custom header component that is used to render the header of the app.
 *
 * Supports React Navigation Native Stack options:
 * - headerStyle, headerTitleStyle, headerTitleAlign
 * - headerLeft, headerTitle, headerRight
 * - headerShadowVisible (border bottom)
 * - title (fallback for headerTitle)
 */
export default function CustomNavigationHeader({ options }: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets();
  const hasExperimentalHeader = useExperimental();

  // When ExperimentalHeader is visible, don't add status bar padding (it's already handled)
  const topPadding = hasExperimentalHeader ? 0 : insets.top;

  const HeaderLeft = options.headerLeft;
  const HeaderTitleComponent = options.headerTitle;
  const HeaderRight = options.headerRight;

  const renderTitle = () => {
    if (HeaderTitleComponent) {
      if (typeof HeaderTitleComponent === "function") {
        const title = options.title !== undefined ? options.title : "";
        return <HeaderTitleComponent>{title}</HeaderTitleComponent>;
      }
      return HeaderTitleComponent;
    }
    const title = options.title !== undefined ? options.title : "";
    return <HeaderTitle>{title}</HeaderTitle>;
  };

  const headerStyleObj =
    options.headerStyle && typeof options.headerStyle === "object" ? options.headerStyle : {};
  const borderBottomColor =
    "borderBottomColor" in headerStyleObj ? headerStyleObj.borderBottomColor : "#00000029";

  return (
    <View
      style={[
        customHeaderStyles.container,
        options.headerStyle,
        {
          paddingTop: topPadding,
          height: topPadding + NAVIGATION_HEADER_HEIGHT,
          ...(options.headerShadowVisible !== false && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            borderBottomColor: borderBottomColor as string,
          }),
        },
      ]}
    >
      <View style={customHeaderStyles.content}>
        <View style={customHeaderStyles.left}>{HeaderLeft ? <HeaderLeft /> : null}</View>
        <View
          style={[
            customHeaderStyles.center,
            options.headerTitleAlign === "left" && customHeaderStyles.centerLeft,
          ]}
        >
          {renderTitle()}
        </View>
        <View style={customHeaderStyles.right}>{HeaderRight ? <HeaderRight /> : null}</View>
      </View>
    </View>
  );
}

const customHeaderStyles = StyleSheet.create({
  container: {
    width: "100%",
  },
  content: {
    height: NAVIGATION_HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 50,
  },
  center: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  centerLeft: {
    justifyContent: "flex-start",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 50,
    justifyContent: "flex-end",
  },
});
