/* eslint-disable no-console */
import { storiesOf } from "../storiesOf";
import React from "react";
import CardA from "../../../src/components/Cards/CardA";
import CardB from "../../../src/components/Cards/CardB";
import Flex from "../../../src/components/Layout/Flex";
import { text, select, number } from "@storybook/addon-knobs";
import { descriptionCardA, descriptionCardB } from "./descriptionsCards";

const CardAStory = () => {
  const variant = select("variant", ["purple", "red"], undefined);
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

const CardBStory = () => {
  const width = number("Container Width", 350);
  const tag = text("tag", "Promo");
  const title = text(
    "title",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam tellus risus, pretium a nulla sit amet, porta sollicitudin tortor.",
  );
  const cta = text("cta", "My cta action");
  const imageUrl = select(
    "url Image",
    [
      "",
      "https://www.cointribune.com/app/uploads/2020/12/LEDGER-Nano-X.jpg?nowebp",
      "https://cdn.shopify.com/s/files/1/2974/4858/products/01_6.png?v=1647271638",
      "https://media.wired.com/photos/630916d9ba2a66af641b11ee/master/pass/Ledger-Nano-X-Gear.jpg",
    ],
    "",
  );

  return (
    <Flex
      backgroundColor={"primary.c70"}
      height={300}
      width={width}
      alignItems="center"
      justifyContent={"center"}
      p={"16px"}
    >
      <CardB
        tag={tag}
        title={title}
        cta={cta}
        imageUrl={imageUrl}
        onPress={() => console.log("PRESS")}
        onPressDismiss={() => console.log("DISMISS")}
      />
    </Flex>
  );
};

storiesOf((story) =>
  story("Cards", module)
    .add("Card A", CardAStory, {
      docs: {
        title: "Card A",
        description: {
          component: descriptionCardA,
        },
      },
    })
    .add("Card B", CardBStory, {
      docs: {
        title: "Card B",
        description: {
          component: descriptionCardB,
        },
      },
    }),
);
