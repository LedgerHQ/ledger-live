import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/react";
import React, { FC, ReactElement, useContext } from "react";

import PortfolioContentCard from "../ContentCard/PortfolioContentCard";
import Carousel from "./";
import { Props } from "./types";

type Args = Omit<Props, "children"> & { children: number };
type Parameters = { Slide: FC<{ index: number }> };

const SlideContext = React.createContext<ReactElement[]>([]);
export default {
  title: "Layout/Carousel",
  argTypes: {
    children: {
      description: "The elements to be displayed.",
      control: { type: "range", min: 0, max: 10, step: 1 },
    },
    variant: {
      description: "Variant for the carousel.",
      options: ["default", "content-card"],
      defaultValue: "default",
      control: "inline-radio",
    },
    autoPlay: {
      description: "The time in milliseconds between automatic slide change (0 for no auto-play).",
    },
    onNext: {
      description: "Function called when the user moves to the next slide.",
    },
    onPrev: {
      description: "Function called when the user moves to the previous slide.",
    },
  },
  args: {
    variant: "default",
    children: 5,
    autoPlay: 0,
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
          <parameters.Slide key={index} index={index} />
        ))}
      >
        <Story />
      </SlideContext.Provider>
    ),
  ],
  render: ({ children, ...props }: Args) => (
    <Carousel {...props}>{useContext(SlideContext)}</Carousel>
  ),
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
    Slide: (({ index }) => (
      <PortfolioContentCard
        title="Ledger Recover"
        description="Get peace of mind and start your free trial."
        cta={index % 2 ? undefined : "Start my free trial"}
        tag={index % 3 ? undefined : "New"}
        image={(index + 1) % 4 ? IMAGE_SRC : undefined}
        onClick={() => onSlideAction(`click on slide ${index}`)}
        onClose={() => onSlideAction(`close slide ${index}`)}
      />
    )) satisfies Parameters["Slide"],
  },
};

const onSlideAction = action("onSlideAction");

const IMAGE_SRC =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='450' height='526' viewBox='0 0 450 526'><defs><linearGradient id='g' x0='0' y0='0' x1='1' y1='1'><stop stop-color='%23000' offset='0%' /><stop stop-color='%23FFF' offset='100%' /></linearGradient></defs><path d='M0,0 H450 V526 Q0,526 0,0 z' fill='url(%23g)' /></svg>";
