import React from "react";
import { Flex } from "../../../src";
import { storiesOf } from "../storiesOf";
import CardA from "../../../src/components/Cards/CardA";
import CardB from "../../../src/components/Cards/CardB";

const CardAStory = () => (
  <Flex width="500px" height="500px" bg="neutral.c20" alignItems="center" justifyContent="center">
    <Flex width="320px">
      <CardA></CardA>
    </Flex>
  </Flex>
);

const CardBStory = () => <CardB></CardB>;

storiesOf((story) => story("Cards", module).add("Card A", CardAStory).add("Card B", CardBStory));
