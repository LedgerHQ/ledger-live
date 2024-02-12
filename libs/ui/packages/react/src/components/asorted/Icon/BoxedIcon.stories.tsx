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
      description:
        "[Not a BoxedIcon prop, only for this Storybook example] - Icon name. Value is passed to the `Icon` component of this UI library which is then used for the `Icon` prop.",
      options: iconNames,
      control: { type: "select" },
    },
    exampleBadgeName: {
      type: "enum",
      description:
        "[Not a BoxedIcon prop, only for this Storybook example] - Badge icon name. Value is passed to the `Icon` component of this UI library which is then used for the `Badge` prop.",
      options: iconNames,
      control: { type: "select" },
    },
    exampleBadgeEnabled: {
      type: "boolean",
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
      control: { type: "color" },
    },
    badgeColor: {
      type: "string",
      control: { type: "color" },
    },
    borderColor: {
      type: "string",
      control: { type: "color" },
    },
    iconSize: {
      type: "number",
    },
    badgeSize: {
      type: "number",
    },
    size: {
      type: "number",
    },
  },
  args: {
    exampleIconName: "Activity",
    exampleBadgeName: "CircledCheckSolid",
    exampleBadgeEnabled: true,
    iconColor: "hsla(110, 50%, 57%, 1)",
    badgeColor: "hsla(110, 50%, 57%, 1)",
    borderColor: "success.c40",
    iconSize: DEFAULT_ICON_SIZE,
    badgeSize: DEFAULT_BADGE_SIZE,
    size: DEFAULT_BOX_SIZE,
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
