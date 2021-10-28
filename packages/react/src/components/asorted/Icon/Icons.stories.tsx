import React from "react";
import Icon, { iconNames, Props as IconProps } from "./Icon";
import { useTheme } from "styled-components";

const Story = {
  title: "Asorted/Icons",
  argTypes: {
    weight: {
      type: "enum",
      description: "Weight",
      defaultValue: "Regular",
      control: {
        options: ["Light", "Medium", "Regular", "Thin", "UltraLight"],
        control: {
          type: "select",
        },
      },
    },
    size: {
      type: "number",
      description: "Icon size for preview",
      defaultValue: 32,
    },
    color: {
      type: "string",
      description: "Color",
      control: { control: "color" },
    },
    name: {
      type: "enum",
      defaultValue: "Activity",
      description: "[Only for single icon], Icon name",
      control: {
        options: iconNames,
        control: {
          type: "select",
        },
      },
    },
  },
};
export default Story;

const ListTemplate = (args: IconProps) => {
  const theme = useTheme();
  const color = args.color || theme.colors.palette.neutral.c100;

  return (
    <div>
      {iconNames.map((name) => (
        <span title={name}>
          <Icon key={name} name={name} weight={args.weight} size={args.size} color={color} />
        </span>
      ))}
    </div>
  );
};
const IconTemplate = (args: IconProps) => {
  const theme = useTheme();
  const color = args.color || theme.colors.palette.neutral.c100;

  return <Icon {...args} color={color} />;
};

export const List = ListTemplate.bind({});
export const SingleIcon = IconTemplate.bind({});
