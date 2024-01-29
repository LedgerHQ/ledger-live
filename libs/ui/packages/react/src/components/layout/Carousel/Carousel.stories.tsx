import React from "react";
import Carousel from "./";
import { Props } from "./types";

const CarouselStory = (args: Props) => {
  const slides = [...Array(5)].map((_, index) => (
    <div
      key={index}
      style={{
        backgroundColor: "hsl(" + Math.random() * 360 + ", 100%, 75%)",
        padding: "15px",
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
    },
    variant: {
      description: "Variant for the carousel.",
      options: ["default", "content-card"],
      defaultValue: "default",
      control: { type: "select" },
    },
  },
  args: {
    variant: "default",
  },
  parameters: {
    docs: {
      description: {
        component: "A simple Carousel component.",
      },
    },
  },
};

export const Default = CarouselStory.bind({});
