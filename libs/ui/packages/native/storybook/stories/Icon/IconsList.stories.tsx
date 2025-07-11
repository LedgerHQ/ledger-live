import React from "react";
import { FlatList } from "react-native";
import styled from "styled-components/native";
import * as Icons from "@ledgerhq/icons-ui/native";
import { useTheme } from "styled-components/native";
import { StoryFn } from "@storybook/react";
import Text from "../../../src/components/Text";

export default {
  title: "Icon/Icon",
  component: FlatList,
};

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
  XXL: SizeData;
}

interface IconProps {
  size?: keyof AvailableSizes;
  color?: string;
}

const IconContainer = styled.View`
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 16px;
  border-radius: 4px;
  height: 100px;
  width: 25%;
`;

const IconGrid: React.FC<IconProps> = ({ size = "M", color = "" }) => {
  const iconNames = Object.keys(Icons) as (keyof typeof Icons)[];

  const theme = useTheme();
  const selectedColor = color || theme.colors.neutral.c100;

  const renderItem = ({ item: iconName }: { item: keyof typeof Icons }) => {
    const IconComponent = Icons[iconName];
    return (
      <IconContainer key={iconName}>
        <IconComponent size={size} color={selectedColor} />
        <Text style={{ paddingTop: 6 }}>{iconName}</Text>
      </IconContainer>
    );
  };

  return (
    <FlatList
      data={iconNames}
      renderItem={renderItem}
      keyExtractor={(iconName) => iconName.toString()}
      numColumns={4} // Display 4 icons per row
      /* @ts-expect-error FIXME weird stuff happening here, this prop is legit I promise */
      style={{ width: "100%", height: "100%" }}
      contentContainerStyle={{ alignItems: "stretch", margin: 1 }}
    />
  );
};

export interface IconGridProps {
  size?: keyof AvailableSizes;
  color?: string;
}

export const IconGridStory: StoryFn<IconGridProps> = (args: IconGridProps) => (
  <IconGrid {...args} />
);

IconGridStory.storyName = "Icons";

IconGridStory.args = {
  size: "M",
  color: "",
};

IconGridStory.argTypes = {
  size: {
    options: ["XS", "S", "M", "L", "XL", "XXL"],
    control: {
      type: "select",
    },
  },
  color: { control: "color" },
};
