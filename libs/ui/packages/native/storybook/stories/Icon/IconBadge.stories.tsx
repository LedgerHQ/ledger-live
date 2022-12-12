import { storiesOf } from "../storiesOf";
import React from "react";

import Flex from "../../../src/components/Layout/Flex";
import Box from "../../../src/components/Layout/Box";
import { Icons } from "../../../src/assets";
import IconBadge from "../../../src/components/Icon/IconBadge";

const IconBadgeStory = () => {
  return (
    <Flex flexDirection="column" alignItems="center">
      <IconBadge Icon={Icons.HandshakeMedium} iconColor="success.c100" iconSize={24} />
      <Box height={20} />
      <IconBadge Icon={Icons.BatteryHalfRegular} iconColor="primary.c100" iconSize={24} />
      <Box height={20} />
      <IconBadge Icon={Icons.WarningRegular} iconColor="warning.c100" iconSize={24} />
      <Box height={20} />
      <IconBadge Icon={Icons.CloseRegular} iconColor="error.c100" iconSize={24} />
      <Box height={20} />
    </Flex>
  );
};

storiesOf((story) => story("Icon", module).add("IconBadge", IconBadgeStory));
