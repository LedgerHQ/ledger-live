import React from "react";
import { ComponentStory } from "@storybook/react-native";

import Flex from "../../../src/components/Layout/Flex";
import Box from "../../../src/components/Layout/Box";
import { IconsLegacy } from "../../../src/assets";
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
      <BoxedIcon Icon={IconsLegacy.HandshakeMedium} variant={variant} />
      <Box height={20} />
      <BoxedIcon
        Icon={IconsLegacy.HandshakeMedium}
        Badge={IconsLegacy.CircledCheckSolidMedium}
        iconColor="success.c50"
        borderColor="success.c40"
        badgeColor="success.c50"
        variant={variant}
      />
      <Box height={20} />
      <BoxedIcon
        Icon={IconsLegacy.HandshakeMedium}
        Badge={IconsLegacy.CircledCrossSolidMedium}
        iconColor="error.c50"
        borderColor="error.c40"
        badgeColor="error.c50"
        variant={variant}
      />
      <Box height={20} />
      <BoxedIcon
        Icon={IconsLegacy.HandshakeMedium}
        Badge={IconsLegacy.ClockSolidMedium}
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
