import React from "react";
import { Dimensions, PixelRatio, Platform, StyleSheet } from "react-native";
import { CircledCheckSolidMedium } from "@ledgerhq/icons-ui/native";
import styled, { useTheme } from "styled-components/native";
import Svg, { Line } from "react-native-svg";

import Flex, { Props as FlexProps } from "../../Flex";
import { ItemStatus } from "../types";
import { Theme } from "src/styles/theme";

type SegmentProps = { status: ItemStatus; hidden?: boolean; height?: number };

const dashLength = 4;
const linesWidth = 2;

/**
 * We have to set a fixed size for the lines (and then they get clipped with overflow:hidden)
 * because their real height is dynamic (depends on the height of the step) and
 * there seems to be no way to have that height being dynamic without having the
 * scaling effect affecting the length of the stroke dash (the "- - - ").
 * This is kind of a trick but seemingly the only way to have a nice stroke dash
 **/
const linesLength = 5000;

const TopSegmentSvg: React.FC<SegmentProps> = ({ status, hidden, height }) => {
  const theme = useTheme();
  const strokeColor = status === "inactive" ? theme.colors.neutral.c50 : theme.colors.primary.c80;
  const strokeDashArray = status === "inactive" ? `${dashLength}` : undefined;
  return (
    <Flex height={height} width={"100%"} overflow="hidden">
      <Flex style={StyleSheet.absoluteFillObject} alignItems="center">
        <Svg
          height={linesLength}
          width={linesWidth}
          viewBox={`0 0 ${linesWidth} ${linesLength}`}
          preserveAspectRatio="xMinYMin slice"
        >
          <Line
            x1="0"
            y1="0"
            x2="0"
            y2="100"
            strokeWidth={hidden ? 0 : 2 * linesWidth}
            stroke={strokeColor}
            strokeDasharray={strokeDashArray}
          />
        </Svg>
      </Flex>
    </Flex>
  );
};
const topSegmentDefaultHeight = Platform.OS === "android" ? 23 : 21; // difference due to how borders are drawn in android

const BottomSegmentSvg: React.FC<SegmentProps> = ({ status, hidden }) => {
  const theme = useTheme();
  const strokeColor = status === "completed" ? theme.colors.primary.c80 : theme.colors.neutral.c50;
  const strokeDashArray = status === "completed" ? undefined : `${dashLength}`;
  return (
    <Flex flex={1} width={"100%"} style={{ transform: [{ scaleY: -1 }] }} overflow="hidden">
      <Flex style={StyleSheet.absoluteFillObject} alignItems="center">
        <Svg
          height={2 * Dimensions.get("screen").height}
          width={linesWidth}
          viewBox={`0 0 ${linesWidth} ${linesLength}`}
          preserveAspectRatio="xMinYMin slice"
        >
          <Line
            x1="0"
            y1="0"
            x2="0"
            y2="100%"
            strokeWidth={hidden ? 0 : 2 * linesWidth}
            stroke={strokeColor}
            strokeDasharray={strokeDashArray}
            strokeDashoffset={`${dashLength}`}
          />
        </Svg>
      </Flex>
    </Flex>
  );
};

const getIconBackground = (theme: Theme, status: ItemStatus, isLastItem?: boolean) => {
  if (status === "completed") {
    return "transparent";
  } else if (isLastItem) {
    return theme.colors.success.c10;
  } else if (status === "active") {
    return theme.colors.neutral.c40;
  }
  return theme.colors.background.main;
};

const getIconBorder = (theme: Theme, status: ItemStatus, isLastItem?: boolean) => {
  if (isLastItem) {
    return theme.colors.success.c100;
  } else if (status === "inactive") {
    return theme.colors.neutral.c50;
  }
  return theme.colors.primary.c80;
};

const CenterCircle = styled(Flex)<{ status: ItemStatus; isLastItem?: boolean }>`
  border-radius: 9999px;
  width: 16px;
  height: 16px;
  background: ${(p) => getIconBackground(p.theme, p.status, p.isLastItem)};
  border: 2px solid ${(p) => getIconBorder(p.theme, p.status, p.isLastItem)};
  align-items: center;
  justify-content: center;
`;

export type Props = FlexProps & {
  status: ItemStatus;
  isFirstItem?: boolean;
  isLastItem?: boolean;
  topHeight?: number;
};

export default function TimelineIndicator({
  status,
  isFirstItem,
  isLastItem,
  topHeight,
  ...props
}: Props) {
  const { colors } = useTheme();

  return (
    <Flex flexDirection="column" alignItems="center" {...props}>
      <TopSegmentSvg
        status={status}
        hidden={isFirstItem}
        height={PixelRatio.roundToNearestPixel(topHeight || topSegmentDefaultHeight)}
      />
      <CenterCircle status={status} isLastItem={isLastItem}>
        {status === "completed" && (
          <CircledCheckSolidMedium
            color={isLastItem ? colors.success.c100 : colors.primary.c80}
            size={20}
          />
        )}
      </CenterCircle>
      <BottomSegmentSvg status={status} hidden={isLastItem} />
    </Flex>
  );
}

TimelineIndicator.topSegmentDefaultHeight = topSegmentDefaultHeight;
