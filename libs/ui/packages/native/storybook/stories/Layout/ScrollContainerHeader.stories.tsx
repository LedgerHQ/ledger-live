import React from "react";
import { action } from "@storybook/addon-actions";
import ScrollContainerHeader from "../../../src/components/Layout/ScrollContainerHeader";
import Button, { ButtonProps } from "../../../src/components/cta/Button";
import Text from "../../../src/components/Text";
import Flex from "../../../src/components/Layout/Flex";
import Badge from "../../../src/components/tags/Badge";
import { Icons } from "../../../src/assets";
import ScrollContainer from "../../../src/components/Layout/ScrollContainer";

export default {
  title: "Layout/ScrollContainerHeader",
  component: ScrollContainerHeader,
};

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

export const ScrollContainerHeaderStory = (args: typeof ScrollContainerHeaderStoryArgs) => {
  const {
    topLeftSection,
    topRightSection,
    bottomSection,
    topMiddleSection,
    stickyHeaderIndices,
    debug,
  } = args;
  return (
    <Flex flex={1} width="100%">
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
ScrollContainerHeaderStory.storyName = "ScrollContainerHeader";
const ScrollContainerHeaderStoryArgs = {
  topLeftSection: true,
  topRightSection: true,
  bottomSection: true,
  topMiddleSection: false,
  stickyHeaderIndices: false,
  debug: false,
};
ScrollContainerHeaderStory.args = ScrollContainerHeaderStoryArgs;
