import React from "react";
import { Content } from "./components/Content";
import { StaticSection } from "./components/StaticSection";
import { Slides as SlidesComponent, type SlidesProps } from "./Slides";

const Footer = StaticSection;
const ProgressIndicator = StaticSection;

function Slides(props: SlidesProps) {
  return <SlidesComponent {...props} />;
}

Slides.Content = Content;
Slides.ProgressIndicator = ProgressIndicator;
Slides.Footer = Footer;

export { Slides };
export type { SlidesProps };
export { useSlidesContext } from "./context";
export type { SlidesContextValue } from "./context";
