import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react-native";
import InformativeCard from "../../../src/components/Cards/InformativeCard";
import Flex from "../../../src/components/Layout/Flex";
import { descriptionInformativeCard } from "./descriptionsCards";

export default {
  title: "Cards",
  component: InformativeCard,
  parameters: {
    docs: {
      description: {
        component: descriptionInformativeCard,
      },
    },
  },
} as ComponentMeta<typeof InformativeCard>;

export const InformativeCardStory: ComponentStory<typeof InformativeCard> = (
  args: typeof InformativeCardStoryArgs,
) => {
  return (
    <Flex
      backgroundColor={"primary.c20"}
      height={300}
      width={400}
      alignItems="center"
      justifyContent={"center"}
      p={"16px"}
    >
      <InformativeCard
        tag={args.tag}
        title={args.title}
        imageUrl={args.imageUrl?.replace(/&amp;/g, "&")}
      />
    </Flex>
  );
};
InformativeCardStory.storyName = "InformativeCard";
const InformativeCardStoryArgs = {
  tag: "Promo",
  title:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam tellus risus, pretium a nulla sit amet, porta sollicitudin tortor.",
  imageUrl: undefined as string | undefined,
};
InformativeCardStory.args = InformativeCardStoryArgs;
InformativeCardStory.argTypes = {
  imageUrl: {
    options: [
      undefined,
      "https://www.cointribune.com/app/uploads/2020/12/LEDGER-Nano-X.jpg?nowebp",
      "https://cdn.shopify.com/s/files/1/2974/4858/products/01_6.png?v=1647271638",
    ],
  },
};
