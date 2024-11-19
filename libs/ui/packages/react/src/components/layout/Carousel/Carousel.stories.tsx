import type { Meta, StoryObj } from "@storybook/react";
import React, { FC, ReactElement, useContext } from "react";

import PortfolioContentCard from "../ContentCard/PortfolioContentCard";
import Carousel from "./";
import { Props } from "./types";

type Args = Omit<Props, "children"> & { children: number; onSlideAction: (action: string) => void };
type Parameters = { Slide: FC<{ index: number; onSlideAction: (action: string) => void }> };

const SlideContext = React.createContext<ReactElement[]>([]);
export default {
  title: "Layout/Carousel",
  argTypes: {
    children: {
      description: "The elements to be displayed.",
      control: { type: "range", min: 1, max: 10, step: 1 },
    },
    variant: {
      description: "Variant for the carousel.",
      options: ["default", "content-card"],
      defaultValue: "default",
      control: "inline-radio",
    },
    onSlideAction: {},
  },
  args: {
    variant: "default",
    children: 5,
  },
  parameters: {
    docs: {
      description: {
        component: "A simple Carousel component.",
      },
    },
  },
  decorators: [
    (Story: FC, { args, parameters }: { args: Args; parameters: Parameters }) => (
      <SlideContext.Provider
        value={Array.from({ length: args.children }, (_, index) => (
          <parameters.Slide key={index} index={index} onSlideAction={args.onSlideAction} />
        ))}
      >
        <Story />
      </SlideContext.Provider>
    ),
  ],
  render: (args: Args) => <Carousel variant={args.variant}>{useContext(SlideContext)}</Carousel>,
} satisfies Meta<Args>;

export const Default: StoryObj<Args> = {
  parameters: {
    Slide: (({ index }) => (
      <div
        style={{
          backgroundColor: `hsl(${Math.random() * 360}, 100%, 75%)`,
          padding: "16px 24px",
          borderRadius: "5px",
        }}
      >
        Slide {index}
      </div>
    )) satisfies Parameters["Slide"],
  },
};

export const PortfolioContentCards: StoryObj<Args> = {
  parameters: {
    Slide: (({ index, onSlideAction }) => (
      <PortfolioContentCard
        title="Ledger Recover"
        description="Get peace of mind and start your free trial."
        cta="Start my free trial"
        tag="New"
        image="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='450' height='526' viewBox='0 0 450 526'><defs><linearGradient id='g' x0='0' y0='0' x1='1' y1='1'><stop stop-color='%23000' offset='0%' /><stop stop-color='%23FFF' offset='100%' /></linearGradient></defs><path d='M0,0 H450 V526 Q0,526 0,0 z' fill='url(%23g)' /></svg>"
        onClick={() => onSlideAction(`click on slide ${index}`)}
        onClose={() => onSlideAction(`close slide ${index}`)}
      />
    )) satisfies Parameters["Slide"],
  },
};
