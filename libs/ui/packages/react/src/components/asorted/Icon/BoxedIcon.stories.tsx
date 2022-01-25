import React from "react";
import Icon, { iconNames } from "./Icon";
import BoxedIconC, {
  BoxedIconProps,
  IconProps,
  DEFAULT_BOX_SIZE,
  DEFAULT_ICON_SIZE,
  DEFAULT_BADGE_SIZE,
} from "./BoxedIcon";

const ExampleIcon = ({ size, color, name }: IconProps & { name: string }) => (
  <Icon name={name} {...{ size, color }} />
);

const Story = {
  title: "Asorted/Icons/BoxedIcon",
  component: BoxedIconC,
  argTypes: {
    exampleIconName: {
      type: "enum",
      defaultValue: "Activity",
      description:
        "[Not a BoxedIcon prop, only for this Storybook example] - Icon name. Value is passed to the `Icon` component of this UI library which is then used for the `Icon` prop.",
      control: {
        options: iconNames,
        control: {
          type: "select",
        },
      },
    },
    exampleBadgeName: {
      type: "enum",
      defaultValue: "CircledCheckSolid",
      description:
        "[Not a BoxedIcon prop, only for this Storybook example] - Badge icon name. Value is passed to the `Icon` component of this UI library which is then used for the `Badge` prop.",
      control: {
        options: iconNames,
        control: {
          type: "select",
        },
      },
    },
    exampleBadgeEnabled: {
      type: "boolean",
      defaultValue: true,
      description:
        "[Not a BoxedIcon prop, only for this Storybook example] - Controls whether a `Badge` prop is passed to the `BoxedIcon` component.",
    },
    Badge: {
      control: false,
    },
    Icon: {
      control: false,
    },
    iconColor: {
      type: "string",
      defaultValue: "hsla(110, 50%, 57%, 1)",
      control: { control: "color" },
    },
    badgeColor: {
      type: "string",
      defaultValue: "hsla(110, 50%, 57%, 1)",
      control: { control: "color" },
    },
    borderColor: {
      type: "string",
      defaultValue: "success.c40",
      control: { control: "color" },
    },
    iconSize: {
      type: "number",
      defaultValue: DEFAULT_ICON_SIZE,
    },
    badgeSize: {
      type: "number",
      defaultValue: DEFAULT_BADGE_SIZE,
    },
    size: {
      type: "number",
      defaultValue: DEFAULT_BOX_SIZE,
    },
  },
};

export default Story;

const BoxedIconTemplate = (
  args: BoxedIconProps & {
    exampleIconName: string;
    exampleBadgeName: string;
    exampleBadgeEnabled: boolean;
  },
) => {
  const badgeColor = args.badgeColor;
  const badgeSize = args.badgeSize;
  const borderColor = args.borderColor;
  const iconColor = args.iconColor;
  const IconComp =
    args.Icon || ((props: IconProps) => <ExampleIcon {...props} name={args.exampleIconName} />);
  const BadgeComp =
    args.Badge || ((props: IconProps) => <ExampleIcon {...props} name={args.exampleBadgeName} />);
  const iconSize = args.iconSize;
  const size = args.size;

  return (
    <BoxedIconC
      Icon={IconComp}
      Badge={args.exampleBadgeEnabled ? BadgeComp : undefined}
      badgeColor={badgeColor}
      badgeSize={badgeSize}
      borderColor={borderColor}
      iconColor={iconColor}
      iconSize={iconSize}
      size={size}
    />
  );
};

export const BoxedIcon = BoxedIconTemplate.bind({});
