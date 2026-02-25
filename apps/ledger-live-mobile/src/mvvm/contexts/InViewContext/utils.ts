import { View } from "react-native";
import { InViewEntry } from "./types";

export async function inViewStatus(
  target: React.RefObject<View | null>,
  threshold: number,
  window: { width: number; height: number },
): Promise<InViewEntry> {
  return new Promise(resolve =>
    target.current?.measureInWindow((x, y, width, height) => {
      const inViewRatioX = InViewProgressRatio(x, width, window.width);
      const inViewRatioY = InViewProgressRatio(y, height, window.height);
      const progressRatio = inViewRatioX * inViewRatioY;
      const isInView = progressRatio > threshold;
      const boundingClientRect = { x, y, width, height };
      resolve({ boundingClientRect, progressRatio, isInView });
    }),
  );
}

function InViewProgressRatio(start: number, length: number, containerLength: number): number {
  const ratioUnderScreensTop = 1 + start / length;
  const ratioAboveScreensBottom = (containerLength - start) / length;
  return Math.max(0, Math.min(1, ratioUnderScreensTop, ratioAboveScreensBottom));
}
