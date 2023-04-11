import React from "react";
import { ComponentStory } from "@storybook/react-native";

import Flex from "../../../src/components/Layout/Flex";
import Box from "../../../src/components/Layout/Box";
import { Icons } from "../../../src/assets";
import BoxedIcon from "../../../src/components/Icon/BoxedIcon";
import Text from "../../../src/components/Text";

export default {
  title: "Icon/BoxedIcon",
  component: BoxedIcon,
  argTypes: {
    variant: {
      options: ["square", "circle"],
      control: { type: "select" },
    },
  },
};

export const BoxedIconStory: ComponentStory<typeof BoxedIcon> = (
  args: typeof BoxedIconStoryArgs,
) => {
  const variant = args.variant;
  return (
    <Flex flexDirection="column" alignItems="center">
      <BoxedIcon Icon={Icons.HandshakeMedium} variant={variant} />
      <Box height={20} />
      <BoxedIcon
        Icon={Icons.HandshakeMedium}
        Badge={Icons.CircledCheckSolidMedium}
        iconColor="success.c100"
        borderColor="success.c40"
        badgeColor="success.c100"
        variant={variant}
      />
      <Box height={20} />
      <BoxedIcon
        Icon={Icons.HandshakeMedium}
        Badge={Icons.CircledCrossSolidMedium}
        iconColor="error.c100"
        borderColor="error.c40"
        badgeColor="error.c100"
        variant={variant}
      />
      <Box height={20} />
      <BoxedIcon
        Icon={Icons.HandshakeMedium}
        Badge={Icons.ClockSolidMedium}
        iconColor="neutral.c50"
        badgeColor="neutral.c70"
        variant={variant}
      />
      <Box height={20} />

      <BoxedIcon
        variant={variant}
        Icon={
          <Text variant={"body"} fontWeight={"medium"} color={"neutral.c80"}>
            42
          </Text>
        }
      />
    </Flex>
  );
};
BoxedIconStory.storyName = "BoxedIcon";
const BoxedIconStoryArgs = {
  variant: "square" as const,
};
BoxedIconStory.args = BoxedIconStoryArgs;
