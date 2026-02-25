import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import BannerCard from "../../../src/components/Cards/BannerCard";
import Flex from "../../../src/components/Layout/Flex";
import { descriptionBannerCard } from "./descriptionsCards";
import { WalletConnectMedium } from "@ledgerhq/icons-ui/nativeLegacy";

type BannerCardStoryArgs = {
  width: number;
  title: string;
  typeOfRightIcon: "close" | "arrow";
  hadBackdropFilter: boolean;
};

const meta = {
  title: "Cards",
  component: BannerCard,
  parameters: {
    docs: {
      description: {
        component: descriptionBannerCard,
      },
    },
  },
  argTypes: {
    typeOfRightIcon: {
      options: ["close", "arrow"],
      control: { type: "radio" },
    },
  },
} satisfies Meta<BannerCardStoryArgs>;

export default meta;

type Story = StoryObj<BannerCardStoryArgs>;

export const BannerCardStory: Story = {
  name: "BannerCard",
  args: {
    width: 350,
    title:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam tellus risus, pretium a nulla sit amet, porta sollicitudin tortor.",
    typeOfRightIcon: "close",
    hadBackdropFilter: false,
  },
  render: (args) => (
    <Flex backgroundColor="primary.c70" alignItems="center" justifyContent="center" p="70px">
      <Flex width={args.width}>
        {args.hadBackdropFilter && <Flex bg="red" width={200} height={100} position="absolute" />}
        <BannerCard
          title={args.title}
          onPress={() => {}}
          onPressDismiss={() => {}}
          LeftElement={<WalletConnectMedium />}
          typeOfRightIcon={args.typeOfRightIcon}
        />
      </Flex>
    </Flex>
  ),
};
