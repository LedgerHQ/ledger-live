import React, { memo, useMemo } from "react";
import { View } from "react-native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

type IconStackProps = {
  children?: React.ReactNode;
  size: number;
  overlap?: number;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  testID?: string;
};

function IconStackComponent({
  children,
  size,
  overlap,
  borderWidth = 2,
  borderColor,
  borderRadius,
  testID,
}: IconStackProps) {
  const resolvedOverlap = overlap ?? Math.round(size * 0.25);
  const resolvedBorderRadius = borderRadius ?? Math.round(size * 0.25);

  const styles = useStyleSheet(
    theme => ({
      container: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
      },
      iconWrapper: {
        borderWidth,
        borderColor: borderColor ?? theme.colors.bg.surface,
        borderRadius: resolvedBorderRadius + borderWidth,
        overflow: "hidden" as const,
      },
    }),
    [borderWidth, borderColor, resolvedBorderRadius],
  );

  const wrappedChildren = useMemo(
    () =>
      React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return null;
        return (
          <View
            style={[
              styles.iconWrapper,
              {
                width: size + borderWidth * 2,
                height: size + borderWidth * 2,
                marginLeft: index > 0 ? -resolvedOverlap : 0,
                zIndex: index,
              },
            ]}
          >
            {child}
          </View>
        );
      }),
    [children, styles.iconWrapper, size, borderWidth, resolvedOverlap],
  );

  return (
    <View style={styles.container} testID={testID}>
      {wrappedChildren}
    </View>
  );
}

export const IconStack = memo(IconStackComponent);
