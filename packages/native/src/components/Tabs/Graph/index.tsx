import React from "react";
import styled from "styled-components/native";
import Text from "../../Text";
import TemplateTabs, { BaseTabsProps, TabItemProps } from "../TemplateTabs";

type GraphTabSize = "small" | "medium";

type GraphTabsProps = BaseTabsProps & {
  size?: GraphTabSize;
};

type GraphTabItemProps = TabItemProps & {
  size?: GraphTabSize;
};

const TabBox = styled.TouchableOpacity`
  text-align: center;
  margin: auto;
  flex: 1;
  border-radius: 48px;
  overflow: hidden;
`;

const TabText = styled(Text).attrs<GraphTabItemProps>((p) => ({
  // Avoid conflict with styled-system's size property by nulling size and renaming it
  size: undefined,
  lineHeight: p.size === "medium" ? "36px" : "26px",
  textAlign: "center",
  px: 4,
  height: p.size === "medium" ? "36px" : "26px",
}))``;

const StyledTabs = styled(TemplateTabs)<GraphTabsProps>`
  border: ${(p) => `1px solid ${p.theme.colors.neutral.c40}`};
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
  disabled,
}: GraphTabItemProps): React.ReactElement => {
  return (
    <TabBox onPress={onPress} disabled={disabled}>
      {isActive ? (
        <TabText
          variant="small"
          size={size}
          bg={activeBg}
          color={disabled ? "neutral.c70" : activeColor}
          fontWeight="semiBold"
        >
          {label}
        </TabText>
      ) : (
        <TabText variant="small" size={size} color={disabled ? "neutral.c70" : "neutral.c90"}>
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
