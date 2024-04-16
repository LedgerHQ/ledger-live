import React from "react";
import { Story, Meta } from "@storybook/react";
import * as Icons from "@ledgerhq/icons-ui/react";
import styled from "styled-components";
import { Flex, Text } from "../../..";
import { useTheme } from "styled-components";

interface SizeData {
  size: number;
  stroke: number;
}

interface AvailableSizes {
  XS: SizeData;
  S: SizeData;
  M: SizeData;
  L: SizeData;
  XL: SizeData;
}

export default {
  title: "asorted/Icons",
  component: null, // Since we're rendering multiple icons, we don't have a single component to import
} as Meta;

interface IconProps {
  size?: keyof AvailableSizes;
  color?: string;
  style?: React.CSSProperties;
}

const IconContainer = styled(Flex).attrs<{ active?: boolean }>({
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "center",
  p: 4,
  fill: "black",
})<{ active?: boolean }>`
  ${p => (p.active ? `background-color: ${p.theme.colors.neutral.c20};` : ``)}
  border-radius: 4px;
  height: 100px;
`;

const IconGridTemplate: React.FC<IconProps> = ({ size, color, style }) => {
  const iconNames = Object.keys(Icons) as (keyof typeof Icons)[];

  const theme = useTheme();
  const selectedColor = color || theme.colors.neutral.c100;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
      {iconNames.map(iconName => {
        const IconComponent = Icons[iconName];
        return (
          <IconContainer key={iconName}>
            <IconComponent size={size} color={selectedColor} style={style} />
            <Text pt={6}>{iconName}</Text>
          </IconContainer>
        );
      })}
    </div>
  );
};

export const IconGrid: Story<IconProps> = (args: IconProps) => <IconGridTemplate {...args} />;

IconGrid.args = {
  size: "M",
  color: "",
  style: {},
};

IconGrid.argTypes = {
  size: {
    options: ["XS", "S", "M", "L", "XL"],
    control: {
      type: "select",
    },
  },
  color: { control: "color" },
  style: { control: "object" },
};
