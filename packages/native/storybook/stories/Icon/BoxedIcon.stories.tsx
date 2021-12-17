import { storiesOf } from "../storiesOf";
import React from "react";
import Flex from "../../../src/components/Layout/Flex";
import Box from "../../../src/components/Layout/Box";
import { Icons } from "../../../src/assets";
import BoxedIcon from "../../../src/components/Icon/BoxedIcon";

const BoxedIconStory = () => (
  <Flex flexDirection="column" alignItems="center">
    <BoxedIcon Icon={Icons.HandshakeMedium} />
    <Box height={20} />
    <BoxedIcon
      Icon={Icons.HandshakeMedium}
      Badge={Icons.CircledCheckSolidMedium}
      iconColor="success.c100"
      borderColor="success.c40"
      badgeColor="success.c100"
    />
    <Box height={20} />
    <BoxedIcon
      Icon={Icons.HandshakeMedium}
      Badge={Icons.CircledCrossSolidMedium}
      iconColor="error.c100"
      borderColor="error.c40"
      badgeColor="error.c100"
    />
    <Box height={20} />
    <BoxedIcon
      Icon={Icons.HandshakeMedium}
      Badge={Icons.ClockSolidMedium}
      iconColor="neutral.c50"
      badgeColor="neutral.c70"
    />
  </Flex>
);

storiesOf((story) => story("Icon", module).add("BoxedIcon", BoxedIconStory));
