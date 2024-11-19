import type { Meta, StoryObj } from "@storybook/react";
import PortfolioContentCard, { PortfolioContentCardProps } from ".";

export default {
  title: "Layout/ContentCard/PortfolioContentCard",
  component: PortfolioContentCard,
  argTypes: {
    title: {
      description: "Title of the card.",
    },
    cta: {
      description: "Call to action text.",
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
    cta: "Start my free trial",
    image:
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='450' height='526' viewBox='0 0 450 526'><defs><linearGradient id='g' x0='0' y0='0' x1='1' y1='1'><stop stop-color='%23000' offset='0%' /><stop stop-color='%23FFF' offset='100%' /></linearGradient></defs><path d='M0,0 H450 V526 Q0,526 0,0 z' fill='url(%23g)' /></svg>",
  },
} satisfies Meta<PortfolioContentCardProps>;

export const WithCta: StoryObj<PortfolioContentCardProps> = {};

export const WithoutCta: StoryObj<PortfolioContentCardProps> = {
  args: { cta: undefined },
};

export const WithTag: StoryObj<PortfolioContentCardProps> = {
  args: { tag: "New" },
};
