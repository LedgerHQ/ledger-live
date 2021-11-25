import React from "react";
import { storiesOf } from "../storiesOf";
import { action } from "@storybook/addon-actions";

import ScrollContainerHeader from "../../../src/components/Layout/ScrollContainerHeader";
import Button from "../../../src/components/cta/Button";
import Text from "../../../src/components/Text";
import Flex from "../../../src/components/Layout/Flex";
import Badge from "../../../src/components/tags/Badge";
import { Icons } from "../../../src/assets";
import ScrollContainer from "../../../src/components/Layout/ScrollContainer";

const TopRightSection = () => {
  return (
    <Flex flexDirection="row">
      <Button
        mx={2}
        Icon={Icons.PlusMedium}
        onPress={action("plus icon pressed")}
      />
      <Button Icon={Icons.CloseMedium} onPress={action("cross icon pressed")} />
    </Flex>
  );
};

const BottomSection = () => {
  return (
    <ScrollContainer mt={4} horizontal>
      {Array(12)
        .fill(0)
        .map((_, index) => (
          <Flex mr={index !== 11 ? 4 : 0} key={index}>
            <Badge active={index === 0}>Filter</Badge>
          </Flex>
        ))}
    </ScrollContainer>
  );
};

const ScrollContainerHeaderStory = () => {
  return (
    <ScrollContainerHeader
      TopLeftSection={
        <Button mr={2} Icon={Icons.ArrowLeftMedium} size="small" />
      }
      TopRightSection={<TopRightSection />}
      MiddleSection={<Text variant="h2">TITLE</Text>}
      BottomSection={<BottomSection />}
    >
      {Array(20)
        .fill(0)
        .map((_, i) => (
          <Flex
            height="100px"
            key={i}
            bg={i % 2 ? "primary.c20" : "neutral.c20"}
          />
        ))}
    </ScrollContainerHeader>
  );
};

storiesOf((story) =>
  story("Layout", module).add(
    "ScrollContainerHeader",
    ScrollContainerHeaderStory
  )
);
