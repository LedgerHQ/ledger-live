import { storiesOf } from "../storiesOf";
import React from "react";
import { select } from "@storybook/addon-knobs";

import Flex from "../../../src/components/Layout/Flex";
import Box from "../../../src/components/Layout/Box";
import { Icons } from "../../../src/assets";
import BoxedIcon from "../../../src/components/Icon/BoxedIcon";
import Text from "../../../src/components/Text";

const BoxedIconStory = () => {
  const variant = select("variant", ["square", "circle"], "square");
  return (
    <Flex flexDirection="column" alignItems="center">
      <BoxedIcon
        Icon={Icons.HandshakeMedium}
        variant={select("variant", ["square", "circle"], "square")}
      />
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

storiesOf((story) => story("Icon", module).add("BoxedIcon", BoxedIconStory));
