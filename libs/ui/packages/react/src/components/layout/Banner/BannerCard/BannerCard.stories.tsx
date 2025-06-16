import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { Text } from "../../../asorted";
import { Button, Link } from "../../../cta";
import BannerCard from ".";

const meta: Meta<typeof BannerCard> = {
  title: "Layout/Banner/BannerCard",
  component: BannerCard,
  argTypes: {
    title: {
      description: "Title of the card.",
    },
    cta: {
      description: "Call to action element.",
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
    onClose: {
      description: "Function to be called when the close button is clicked.",
    },
  },
  args: {
    title: "Ledger Recover",
    description: "Get peace of mind and start your free trial.",
    cta: (
      <Link>
        <Text>Start my free trial</Text>
      </Link>
    ),
    tag: "New",
    image:
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='450' height='526' viewBox='0 0 450 526'><defs><linearGradient id='g' x0='0' y0='0' x1='1' y1='1'><stop stop-color='%23000' offset='0%' /><stop stop-color='%23FFF' offset='100%' /></linearGradient></defs><path d='M0,0 H450 V526 Q0,526 0,0 z' fill='url(%23g)' /></svg>",
  },
};
export default meta;

type Story = StoryObj<typeof BannerCard>;

export const Default: Story = {};

export const LNSCardBanner: Story = {
  args: {
    title: "Limited memory, limited experience",
    description: (
      <>
        Upgrade your Nano S to a newer Ledger — like the Ledger Flex — for more memory, the latest
        security enhancements, fresh features, and{" "}
        <Text color="primary.c80">an exclusive 20% off</Text>.
      </>
    ),
    cta: (
      <Button variant="main" outline={false}>
        Upgrade my Ledger
      </Button>
    ),
    tag: undefined,
    onClose: undefined,
    borderRadius: "5px",
  },
};
