import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import Carousel from "./";
import { Props } from "./types";

const CarouselStory = (args: Omit<Props, "children"> & { children: number }) => {
  const slides = Array.from({ length: args.children }, (_, index) => (
    <div
      key={index}
      style={{
        backgroundColor: "hsl(" + Math.random() * 360 + ", 100%, 75%)",
        padding: "16px 24px",
        borderRadius: "5px",
      }}
    >
      Slide {index}
    </div>
  ));

  return <Carousel variant={args.variant} children={slides} />;
};

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
  render: CarouselStory,
} satisfies Meta;

export const Default: StoryObj = {};
