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
  border-radius: ${(p) => p.theme.radii[1]}px;
  box-sizing: border-box;
  overflow: hidden;
  margin-left: ${(p) => p.theme.space[1]}px;
`;

const TabText = styled(Text).attrs<GraphTabItemProps>((p) => ({
  // Avoid conflict with styled-system's size property by nulling size and renaming it
  size: undefined,
  lineHeight: p.size === "medium" ? "40px" : "26px",
  textAlign: "center",
  height: p.size === "medium" ? "40px" : "26px",
  width: 40,
}))``;

const StyledTabs = styled(TemplateTabs)`
  display: flex;
  justify-content: center;
`;

export const GraphTab = ({
  onPress,
  isActive,
  label,
  activeColor = "neutral.c100",
  activeBg = "neutral.c30",
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
          uppercase
        >
          {label}
        </TabText>
      ) : (
        <TabText
          variant="small"
          size={size}
          color={disabled ? "neutral.c40" : "neutral.c70"}
          fontWeight={"semiBold"}
          uppercase
        >
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
