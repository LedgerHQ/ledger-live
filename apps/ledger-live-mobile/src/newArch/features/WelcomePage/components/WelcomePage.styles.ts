import { View } from "react-native";
import Styled from "styled-components/native";
import { Text } from "@ledgerhq/native-ui";

export const LogoView = Styled(View)`
  position: absolute;
  top: 86px;
  left: 22px;
  z-index: 1;
`;

export const VideoTitleText = Styled(Text).attrs({
  variant: "large",
  color: "constant.white",
})`
  position: absolute;
  top: 136px;
  left: 16px;
  right: 16px;
  text-align: left;
  font-size: 28px;
  font-weight: 600;
  line-height: 36px;
`;

export const StoryProgressView = Styled(View)`
  position: absolute;
  top: 60px;
  left: 16px;
  right: 16px;
  z-index: 1;
  background-color: transparent;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8;
`;
