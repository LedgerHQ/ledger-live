import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react-native";
import SideImageCard from "../../../src/components/Cards/SideImageCard";
import Flex from "../../../src/components/Layout/Flex";
import { descriptionSideImageCard } from "./descriptionsCards";

export default {
  title: "Cards",
  component: SideImageCard,
  parameters: {
    docs: {
      description: {
        component: descriptionSideImageCard,
      },
    },
  },
} as ComponentMeta<typeof SideImageCard>;

export const SideImageCardStory: ComponentStory<typeof SideImageCard> = (
  args: typeof SideImageCardStoryArgs,
) => {
  return (
    <Flex backgroundColor="primary.c70" alignItems="center" justifyContent="center" p="16px">
      <Flex width={args.width}>
        <SideImageCard
          tag={args.tag}
          title={args.title}
          cta={args.cta}
          imageUrl={args.imageUrl}
          onPress={() => {}}
          onPressDismiss={() => {}}
        />
      </Flex>
    </Flex>
  );
};
SideImageCardStory.storyName = "SideImageCard";
const SideImageCardStoryArgs = {
  width: 350,
  tag: "Promo",
  title:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam tellus risus, pretium a nulla sit amet, porta sollicitudin tortor.",
  cta: "My cta action",
  imageUrl: undefined,
};
SideImageCardStory.args = SideImageCardStoryArgs;
SideImageCardStory.argTypes = {
  imageUrl: {
    options: [
      undefined,
      "https://www.cointribune.com/app/uploads/2020/12/LEDGER-Nano-X.jpg?nowebp",
      "https://cdn.shopify.com/s/files/1/2974/4858/products/01_6.png?v=1647271638",
      "https://media.wired.com/photos/630916d9ba2a66af641b11ee/master/pass/Ledger-Nano-X-Gear.jpg",
    ],
  },
};
