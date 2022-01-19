import React from "react";
import styled from "styled-components/native";
import Text from "../../Text";
import { TouchableOpacity } from "react-native";
import TemplateTabs, { BaseTabsProps, TabItemProps } from "../TemplateTabs";

type GraphTabSize = "small" | "medium";

type GraphTabsProps = BaseTabsProps & {
  size?: GraphTabSize;
};

type GraphTabItemProps = TabItemProps & {
  size?: GraphTabSize;
};

const TabBox = styled(TouchableOpacity)`
  text-align: center;
  margin: auto;
  flex: 1;
`;

const TabText = styled(Text).attrs<GraphTabItemProps>((p) => ({
  lineHeight: p.size === "medium" ? "36px" : "26px",
  textAlign: "center",
  borderRadius: 48,
  px: p.theme.space[p.size === "medium" ? 7 : 6],
  height: p.size === "medium" ? 36 : 26,
}))``;

const StyledTabs = styled(TemplateTabs)<GraphTabsProps>`
  border: ${(p) => `1px solid ${p.theme.colors.palette.neutral.c40}`};
  border-radius: 35px;
  padding: ${(p) => `${p.theme.space[p.size === "medium" ? 2 : 1]}px`};
`;

export const GraphTab = ({
  onPress,
  isActive,
  label,
  activeColor = "neutral.c100",
  activeBg = "primary.c20",
  size = "medium",
}: GraphTabItemProps): React.ReactElement => {
  return (
    <TabBox onPress={onPress}>
      {isActive ? (
        <TabText
          variant="small"
          size={size}
          bg={activeBg}
          color={activeColor}
          fontWeight="semiBold"
        >
          {label}
        </TabText>
      ) : (
        <TabText variant="small" size={size} color={"neutral.c90"}>
          {label}
        </TabText>
      )}
    </TabBox>
  );
};

const GraphTabs = (props: GraphTabsProps): React.ReactElement => (
  <StyledTabs {...props} Item={GraphTab} />
);

export default GraphTabs;
