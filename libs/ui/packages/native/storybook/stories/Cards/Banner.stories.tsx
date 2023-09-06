import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react-native";
import BannerCard from "../../../src/components/Cards/BannerCard";
import Flex from "../../../src/components/Layout/Flex";
import { descriptionBannerCard } from "./descriptionsCards";
import { WalletConnectMedium } from "@ledgerhq/icons-ui/nativeLegacy";

export default {
  title: "Cards",
  component: BannerCard,
  parameters: {
    docs: {
      description: {
        component: descriptionBannerCard,
      },
    },
  },
} as ComponentMeta<typeof BannerCard>;

export const BannerCardStory: ComponentStory<typeof BannerCard> = (
  args: typeof BannerCardStoryArgs,
) => {
  return (
    <Flex backgroundColor="primary.c70" alignItems="center" justifyContent="center" p="70px">
      <Flex width={args.width}>
        {args.hadBackdropFilter && (
          <Flex bg={"red"} width={200} height={100} position={"absolute"} />
        )}
        <BannerCard
          title={args.title}
          onPress={() => {}}
          onPressDismiss={() => {}}
          LeftElement={<WalletConnectMedium />}
          typeOfRightIcon={args.typeOfRightIcon || "close"}
        />
      </Flex>
    </Flex>
  );
};
BannerCardStory.storyName = "BannerCard";
const BannerCardStoryArgs = {
  width: 350,
  title:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam tellus risus, pretium a nulla sit amet, porta sollicitudin tortor.",
  typeOfRightIcon: undefined,
  hadBackdropFilter: false,
};
BannerCardStory.args = BannerCardStoryArgs;
BannerCardStory.argTypes = {
  typeOfRightIcon: {
    options: ["close", "arrow"],
  },
};
