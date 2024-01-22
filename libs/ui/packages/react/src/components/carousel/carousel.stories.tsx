import React from "react";
import Carousel from "./carousel";

const CarouselStory = () => {
  return (
    <div>
      <Carousel
        slides={[...Array(10)].map((item, index) => ({
          id: index,
          Component: () => <div>Item {index}</div>,
        }))}
      />
    </div>
  );
};

export const Default = CarouselStory.bind({});

export default {
  title: "Layout/Carousel",
  argTypes: {
    slides: {
      description: "The elements to be displayed.",
    },
  },
  parameters: {
    docs: {
      description: {
        component: "A simple Carousel component",
      },
    },
  },
};
