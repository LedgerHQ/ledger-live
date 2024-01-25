import React from "react";
import Carousel from "./";

const CarouselStory = () => {
  return (
    <div>
      <Carousel
        slides={[...Array(10)].map((_, index) => ({
          id: index,
          Component: () => (
            <div
              style={{
                height: "35px",
                backgroundColor: "beige",
              }}
            >
              Item {index}
            </div>
          ),
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
    footerVariant: {
      description: "Styling variant for the footer.",
    },
  },
  parameters: {
    docs: {
      description: {
        component: "A simple Carousel component.",
      },
    },
  },
};
