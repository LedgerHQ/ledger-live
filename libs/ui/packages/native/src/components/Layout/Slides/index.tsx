import React from "react";
import { ProgressIndicator } from "./ProgressIndicator";
import { Slides as SlidesComponent, type SlidesProps } from "./Slides";
import { Content } from "./Content";
import { Footer } from "./Footer";

interface SlidesCompound {
  (props: SlidesProps): React.ReactElement;
  ProgressIndicator: typeof ProgressIndicator;
  Content: typeof Content;
  Footer: typeof Footer;
}

const Slides: SlidesCompound = Object.assign(
  (props: SlidesProps) => <SlidesComponent {...props} />,
  {
    ProgressIndicator,
    Content,
    Footer,
  },
);

export { Slides };
export type { SlidesProps };
export { Slide } from "./Slide";
export { ProgressIndicator } from "./ProgressIndicator";
export { Content } from "./Content";
export { Footer } from "./Footer";
export { useSlidesContext } from "./context";
