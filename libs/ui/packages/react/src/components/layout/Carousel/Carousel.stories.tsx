import React, { useState } from "react";
import Carousel from "./";

const Slide = ({ color, slideNb }: { color?: string; slideNb: number }) => {
  return (
    <div style={{ backgroundColor: color, padding: "15px", borderRadius: "5px" }}>
      Slide {slideNb}
    </div>
  );
};

const CarouselStory = () => {
  const [arr] = useState(
    [...Array(10)].map((_, index) => (
      <Slide
        key={index}
        slideNb={index}
        color={"#" + ((Math.random() * 0xcbbfbb) << 0).toString(16)}
      />
    )),
  );
  return <Carousel children={arr} />;
};

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

export const Default = CarouselStory.bind({});
