import { useStakePositionTitle } from "../../copy/useStakePositionLabels";
import type { StakePositionSurfaceProps } from "./StakePositionSurface.types";
import type { StakePositionSurfaceViewProps } from "./StakePositionSurfaceView.types";

export function useStakePositionSurfaceViewModel({
  heading,
  ticker,
  currencyName,
  ...props
}: StakePositionSurfaceProps): StakePositionSurfaceViewProps {
  const title = useStakePositionTitle(heading, ticker, currencyName);

  return { ...props, title, isTitleInHeader: heading.kind === "details" };
}
