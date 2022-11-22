import React from "react";
import { storiesOf } from "../storiesOf";
import CardA from "../../../src/components/Cards/CardA";
import CardB from "../../../src/components/Cards/CardB";
import { Flex } from "../../../src";
import { text, select } from "@storybook/addon-knobs";

const CardAStory = () => {
  const variant = select("variant", ["purple", "red"], "");
  const tag = text("tag", "Promo");
  const description = text(
    "description",
    "Lorem <bold>ipsum</bold> dolor sit amet, consectetur adipiscing elit.",
  );

  return (
    <Flex width="500px" height="500px" bg="#fff" alignItems="center" justifyContent="center">
      <Flex width="320px">
        <CardA variant={variant} tag={tag} description={description} />
      </Flex>
    </Flex>
  );
};

const CardBStory = () => <CardB></CardB>;

storiesOf((story) => story("Cards", module).add("Card A", CardAStory).add("Card B", CardBStory));
