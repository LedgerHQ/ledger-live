import { storiesOf } from "../storiesOf";
import React from "react";
import CardA from "../../../src/components/Cards/CardA";
import CardB from "../../../src/components/Cards/CardB";
import Flex from "../../../src/components/Layout/Flex";

const CardAStory = () => <CardA></CardA>;

const CardBStory = () => (
  <>
    <Flex
      backgroundColor={"primary.c70"}
      height={300}
      width={500}
      alignItems="center"
      justifyContent={"center"}
      p={"16px"}
    >
      <CardB
        tag="ANNouncement"
        title="This is a card title which spans multiple lines and if takes more lines the text will go out.This is a card title which spans multiple lines and if takes more lines the text will go out"
        cta="My cta to click"
      />
    </Flex>

    <Flex
      p={"16px"}
      mt={18}
      backgroundColor={"primary.c70"}
      height={300}
      width={500}
      alignItems="center"
      justifyContent={"center"}
    >
      <CardB tag="stack" title="This is a short message" cta="My cta to click" />
    </Flex>
  </>
);

storiesOf((story) => story("Cards", module).add("Card A", CardAStory).add("Card B", CardBStory));
