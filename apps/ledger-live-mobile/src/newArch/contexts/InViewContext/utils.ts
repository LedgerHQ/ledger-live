import { View } from "react-native";
import { InViewEntry } from "./types";

export async function inViewStatus(
  target: React.RefObject<View>,
  threshold: number,
  window: { width: number; height: number },
): Promise<InViewEntry> {
  return new Promise(resolve =>
    target.current?.measureInWindow((x, y, width, height) => {
      const inViewRatioX = ratioContained(x, width, window.width);
      const inViewRatioY = ratioContained(y, height, window.height);
      const inViewRatio = inViewRatioX * inViewRatioY;
      const isInView = inViewRatio > threshold;
      const boundingClientRect = { x, y, width, height };
      resolve({ boundingClientRect, inViewRatio, isInView });
    }),
  );
}

function ratioContained(start: number, length: number, containerLength: number): number {
  const ratioMax = containerLength / length;
  const ratioBefore = 1 + start / length;
  const ratioAfter = (containerLength - start) / length;
  return Math.max(0, Math.min(1, ratioMax, ratioBefore, ratioAfter));
}
