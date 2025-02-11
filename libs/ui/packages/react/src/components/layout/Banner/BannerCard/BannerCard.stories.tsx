import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { Text } from "../../../asorted";
import BannerCard, { BannerCardProps } from ".";

export default {
  title: "Layout/Banner/BannerCard",
  component: BannerCard,
  argTypes: {
    title: {
      description: "Title of the card.",
    },
    cta: {
      description: "Call to action text.",
    },
    linkText: {
      description: "Link text.",
    },
    description: {
      description: "Description of the card.",
    },
    tag: {
      description: "Tag to be displayed on top of the card.",
    },
    image: {
      description: "Image to be displayed on the right of the card.",
    },
    onClick: {
      description: "Function to be called when the card is clicked.",
    },
    onLinkClick: {
      description: "Function to be called when the link is clicked.",
    },
    onClose: {
      description: "Function to be called when the close button is clicked.",
    },
  },
  args: {
    title: "Ledger Recover",
    description: "Get peace of mind and start your free trial.",
    cta: "Start my free trial",
    linkText: "Learn more",
    tag: "New",
    image:
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='450' height='526' viewBox='0 0 450 526'><defs><linearGradient id='g' x0='0' y0='0' x1='1' y1='1'><stop stop-color='%23000' offset='0%' /><stop stop-color='%23FFF' offset='100%' /></linearGradient></defs><path d='M0,0 H450 V526 Q0,526 0,0 z' fill='url(%23g)' /></svg>",
  },
} satisfies Meta<BannerCardProps>;

export const Default: StoryObj<BannerCardProps> = {};

export const LNSCardBanner: StoryObj<BannerCardProps> = {
  args: {
    title: "It's time to upgrade",
    description: (
      <>
        Upgrade to our latest devices with <Text color="constant.purple">20% discount</Text> for an
        enhanced security and a seamless experience.
      </>
    ),
    descriptionWidth: 320,
    cta: "Level up my wallet",
    tag: undefined,
    onClose: undefined,
    borderRadius: "5px",
  },
};
