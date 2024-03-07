import React, { useState } from "react";
import styled from "styled-components/native";
import { Flex } from "../../../Layout";
import { Text } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  useAnimatedReaction,
  Easing,
} from "react-native-reanimated";
import { inputTextColor, inputStatusColors, inputBackgroundColor } from "./inputTextColor";
import { InputStatus } from ".";

const labelPadding = 4;

const labelInitialPositions = {
  top: 20.5,
  left: 16 - labelPadding,
  fontSize: 16,
};

const labelFinalPositions = {
  top: -7,
  left: 16 - labelPadding,
  fontSize: 12,
};

const LabelContainer = styled(Animated.View)<{ notched: boolean }>`
  position: absolute;
  padding: ${`0 ${labelPadding}px`};
  height: 15px;
  z-index: ${(p) => (p.notched ? 3 : 0)};
`;

type LabelTextProps = {
  status: InputStatus;
};

const AnimatedText = Animated.createAnimatedComponent(Text);

const LabelText = styled(AnimatedText)<LabelTextProps>`
  height: 15px;
  line-height: 15px;
  vertical-align: top;
  color: ${(p) =>
    p.status === "default" ? inputTextColor[p.status] : inputStatusColors[p.status]};
`;

type LineCutoutProps = {
  status: InputStatus;
  labelWidth: number;
};

const LineCutout = styled(Flex)<LineCutoutProps>`
  position: absolute;
  height: 1px;
  top: 7px;
  left: 0px;
  width: ${(p) => p.labelWidth}px;
  background: ${(p) => inputBackgroundColor[p.status]};
`;

type AnimatedNotchedLabelProps = {
  placeholder: string;
  inputStatus: InputStatus;
};

export const AnimatedNotchedLabel = ({ placeholder, inputStatus }: AnimatedNotchedLabelProps) => {
  const [labelWidth, setLabelWidth] = useState(0);
  const notched = inputStatus !== "default";

  const labelTop = useSharedValue(notched ? labelFinalPositions.top : labelInitialPositions.top);
  const labelLeft = useSharedValue(notched ? labelFinalPositions.left : labelInitialPositions.left);
  const fontSize = useSharedValue(
    notched ? labelFinalPositions.fontSize : labelInitialPositions.fontSize,
  );

  const labelStyle = useAnimatedStyle(() => {
    return {
      top: labelTop.value,
      left: labelLeft.value,
    };
  });

  const labelFontSize = useAnimatedStyle(() => {
    return {
      fontSize: fontSize.value,
    };
  });

  useAnimatedReaction(
    () => notched,
    (isNotched) => {
      const targetTop = isNotched ? labelFinalPositions.top : labelInitialPositions.top;
      const targetLeft = isNotched ? labelFinalPositions.left : labelInitialPositions.left;
      const targetSize = isNotched ? labelFinalPositions.fontSize : labelInitialPositions.fontSize;
      labelTop.value = withTiming(targetTop, undefined, () => ({
        duration: 200,
        easing: Easing.inOut(Easing.quad),
      }));
      labelLeft.value = withTiming(targetLeft, undefined, () => ({
        duration: 200,
        easing: Easing.inOut(Easing.quad),
      }));
      fontSize.value = withTiming(targetSize, undefined, () => ({
        duration: 100,
        easing: Easing.inOut(Easing.quad),
      }));
    },
    [notched],
  );

  return (
    <LabelContainer
      onLayout={(event) => setLabelWidth(event.nativeEvent.layout.width)}
      style={{ ...labelStyle, elevation: notched ? 3 : 0 }}
      notched={notched}
    >
      {notched && <LineCutout status={inputStatus} labelWidth={labelWidth} />}
      <LabelText style={{ ...labelFontSize }} status={inputStatus}>
        {placeholder}
      </LabelText>
    </LabelContainer>
  );
};
