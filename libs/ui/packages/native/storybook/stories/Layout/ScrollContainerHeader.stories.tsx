import React from "react";
import { storiesOf } from "../storiesOf";
import { action } from "@storybook/addon-actions";
import { boolean } from "@storybook/addon-knobs";
import ScrollContainerHeader from "../../../src/components/Layout/ScrollContainerHeader";
import Button, { ButtonProps } from "../../../src/components/cta/Button";
import Text from "../../../src/components/Text";
import Flex from "../../../src/components/Layout/Flex";
import Badge from "../../../src/components/tags/Badge";
import { Icons } from "../../../src/assets";
import ScrollContainer from "../../../src/components/Layout/ScrollContainer";

const TopRightSection = ({ debug }: { debug: boolean }) => {
  return (
    <Flex flexDirection="row" border={debug ? "1px solid purple" : "none"}>
      <Button mx={2} Icon={Icons.PlusMedium} onPress={action("plus icon pressed")} />
      <Button Icon={Icons.CloseMedium} onPress={action("cross icon pressed")} />
    </Flex>
  );
};

const BottomSection = ({ debug }: { debug: boolean }) => {
  return (
    <ScrollContainer mt={4} horizontal border={debug ? "1px solid purple" : "none"}>
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
  const topLeftSection = boolean("TopLeftSection", true);
  const topRightSection = boolean("TopRightSection", true);
  const bottomSection = boolean("BottomSection", true);
  const topMiddleSection = boolean("Different TopMiddleSection", false);
  const stickyHeaderIndices = boolean("StickyHeaderIndex", false);
  const debug = boolean("Debug", false);
  return (
    <Flex flex={1}>
      <ScrollContainerHeader
        width="100%"
        border={debug ? "1px solid red" : "none"}
        flex={1}
        TopLeftSection={
          topLeftSection ? (
            <Button
              mr={2}
              border={debug ? "1px solid purple" : "none"}
              Icon={Icons.ArrowLeftMedium}
              size={"small" as ButtonProps["size"]}
            />
          ) : undefined
        }
        TopRightSection={topRightSection ? <TopRightSection debug={debug} /> : undefined}
        TopMiddleSection={
          topMiddleSection ? (
            <Flex
              height={50}
              border={debug ? "1px solid green" : "none"}
              flexDirection="column"
              justifyContent="center"
            >
              <Text variant="h1">TITLE 2</Text>
            </Flex>
          ) : undefined
        }
        MiddleSection={
          <Flex
            height={50}
            border={debug ? "1px solid blue" : "none"}
            flexDirection="column"
            justifyContent="center"
          >
            <Text variant="h2">TITLE</Text>
          </Flex>
        }
        BottomSection={bottomSection ? <BottomSection debug={debug} /> : undefined}
        stickyHeaderIndices={stickyHeaderIndices ? [1, 4] : []}
      >
        {Array(20)
          .fill(0)
          .map((_, i) => (
            <Flex height="100px" key={i} bg={i % 2 ? "primary.c20" : "neutral.c20"} p={4}>
              <Text variant="body">{i}</Text>
            </Flex>
          ))}
      </ScrollContainerHeader>
    </Flex>
  );
};

storiesOf((story) =>
  story("Layout", module).add("ScrollContainerHeader", ScrollContainerHeaderStory),
);
