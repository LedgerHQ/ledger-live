import React from "react";
import { ComponentStory } from "@storybook/react-native";

import Flex from "../../../src/components/Layout/Flex";
import Box from "../../../src/components/Layout/Box";
import { IconsLegacy } from "../../../src/assets";
import IconBadge from "../../../src/components/Icon/IconBadge";

export default {
  title: "Icon/IconBadge",
  component: IconBadge,
};

export const IconBadgeStory: ComponentStory<typeof IconBadge> = () => {
  return (
    <Flex flexDirection="column" alignItems="center">
      <IconBadge Icon={IconsLegacy.HandshakeMedium} iconColor="success.c100" iconSize={24} />
      <Box height={20} />
      <IconBadge Icon={IconsLegacy.BatteryHalfMedium} iconColor="primary.c100" iconSize={24} />
      <Box height={20} />
      <IconBadge Icon={IconsLegacy.WarningMedium} iconColor="warning.c100" iconSize={24} />
      <Box height={20} />
      <IconBadge Icon={IconsLegacy.CloseMedium} iconColor="error.c100" iconSize={24} />
      <Box height={20} />
    </Flex>
  );
};

IconBadgeStory.storyName = "IconBadge";
