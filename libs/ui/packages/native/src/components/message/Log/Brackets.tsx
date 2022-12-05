import React from "react";
import styled, { useTheme } from "styled-components/native";
import { Svg, Path } from "react-native-svg";
import FlexBox, { FlexBoxProps } from "../../Layout/Flex";
import { getColor } from "../../../styles";
import { ViewStyle } from "react-native";
import { I18nManager } from "react-native";

const BracketContainer = styled(FlexBox).attrs({
  flexDirection: "column",
  position: "relative",
  justifyContent: "space-between",
})``;

type BracketProps = {
  color: string;
};

type BaseBracketProps = FlexBoxProps &
  BracketProps & {
    style?: ViewStyle;
  };

export const Bracket = ({ color, style, mb, mt }: BaseBracketProps): React.ReactElement => {
  const theme = useTheme();
  const fill = getColor(theme, color);
  return (
    <BracketContainer style={style} mb={mb} mt={mt}>
      <Svg width="17" height="10" viewBox="0 0 17 10">
        <Path d="M16.8125 0H2.8125H0.8125V2V10H2.8125V2H16.8125V0Z" fill={fill} />
      </Svg>
    </BracketContainer>
  );
};

type RTLBracketProps = {
  children: React.ReactNode;
};

const RTLBracketManager = ({ children }: RTLBracketProps) => {
  return (
    <FlexBox style={{ transform: I18nManager.isRTL ? [{ scaleX: -1 }] : undefined }}>
      {children}
    </FlexBox>
  );
};

export const BracketTopLeft = ({ color }: BracketProps) => {
  return (
    <RTLBracketManager>
      <Bracket color={color} />
    </RTLBracketManager>
  );
};

export const BracketTopRight = ({ color }: BracketProps) => {
  return (
    <RTLBracketManager>
      <Bracket color={color} style={{ transform: [{ scaleX: -1 }] }} />
    </RTLBracketManager>
  );
};

export const BracketBottomLeft = ({ color }: BracketProps) => {
  return (
    <RTLBracketManager>
      <Bracket color={color} style={{ transform: [{ scaleY: -1 }] }} />
    </RTLBracketManager>
  );
};

export const BracketBottomRight = ({ color }: BracketProps) => {
  return (
    <RTLBracketManager>
      <Bracket color={color} style={{ transform: [{ scale: -1 }] }} />
    </RTLBracketManager>
  );
};
