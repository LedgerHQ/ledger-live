import { ProgressIndicator } from "./ProgressIndicator";
import { Slide } from "./Slide";
import { Slides as SlidesComponent, type SlidesProps } from "./Slides";

function Slides(props: SlidesProps) {
  return <SlidesComponent {...props} />;
}
Slides.Slide = Slide;
Slides.ProgressIndicator = ProgressIndicator;

export { Slides };
export type { SlidesProps };
export { Slide } from "./Slide";
export { ProgressIndicator } from "./ProgressIndicator";
export { useSlidesContext, useSlideContext } from "./context";
