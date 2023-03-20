import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React, { useMemo } from "react";
import { Image, StyleProp, ViewStyle, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import styled, { useTheme } from "styled-components/native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

export type Props = {
  id?: string;
  title: string;
  index: number;
  seen: boolean;
  iconUrl?: string;
  onPress: () => void;
  titlePosition: "bottom" | "right";
};

const innerImageSize = 56;
const borderWidth = 2;
const borderInnerPadding = 2;

const IllustrationContainer = styled(Flex)<{ seen: boolean }>`
  padding: ${borderInnerPadding + borderWidth}px;
  border-radius: 100px;
`;

const Illustration = styled(Image).attrs({
  blurRadius: 2.5,
  resizeMode: "cover",
})`
  height: ${innerImageSize}px;
  width: ${innerImageSize}px;
  border-radius: 72px;
`;

const Border: React.FC<{ seen: boolean }> = ({ seen }) => {
  const { colors } = useTheme();
  const containerSize =
    innerImageSize + 2 * borderWidth + 2 * borderInnerPadding;
  return (
    <Flex position="absolute" height={containerSize} width={containerSize}>
      <Svg height={containerSize} width={containerSize}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="1" x2="1" y2="0">
            <Stop
              offset="0"
              stopColor={seen ? colors.neutral.c30 : "#461AF7"}
              stopOpacity="1"
            />
            <Stop
              offset="1"
              stopColor={seen ? colors.neutral.c30 : "#FF6E33"}
              stopOpacity="1"
            />
          </LinearGradient>
        </Defs>
        <Circle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={innerImageSize / 2 + borderInnerPadding}
          strokeWidth={borderWidth}
          stroke="url(#grad)"
        />
      </Svg>
    </Flex>
  );
};

const StoryGroupItem: React.FC<Props> = props => {
  const { onPress, seen, title, iconUrl, titlePosition } = props;
  const containerStyle: StyleProp<ViewStyle> = useMemo(
    () =>
      titlePosition === "bottom"
        ? {
            flexDirection: "column",
            alignItems: "center",
          }
        : {
            flexDirection: "row",
            alignItems: "center",
          },
    [titlePosition],
  );

  const titleProps: React.ComponentProps<typeof Text> =
    titlePosition === "bottom"
      ? {
          mt: 3,
          maxWidth: 130,
          textAlign: "center",
        }
      : {
          ml: 6,
          flexShrink: 1,
        };
  return (
    <TouchableOpacity onPress={onPress || undefined} style={containerStyle}>
      <IllustrationContainer seen={seen}>
        <Flex
          height={innerImageSize}
          width={innerImageSize}
          borderRadius={innerImageSize}
          backgroundColor="neutral.c30"
        >
          <Illustration source={{ uri: iconUrl }} />
          <Flex
            style={StyleSheet.absoluteFillObject}
            justifyContent="center"
            alignItems="center"
            backgroundColor="rgba(255,255,255,0.03)"
            borderRadius={innerImageSize}
          >
            <Icons.PlayMedium size={24} color="constant.white" />
          </Flex>
        </Flex>
        <Border seen={seen} />
      </IllustrationContainer>
      <Text variant="body" fontWeight="medium" {...titleProps}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default StoryGroupItem;
