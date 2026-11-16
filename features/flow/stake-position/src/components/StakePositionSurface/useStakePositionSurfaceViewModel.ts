import { useStakePositionTitle } from "../../copy/useStakePositionLabels";
import type { StakePositionSurfaceProps } from "./StakePositionSurface.types";
import type { StakePositionSurfaceViewProps } from "./StakePositionSurfaceView.types";

export function useStakePositionSurfaceViewModel({
  heading,
  ticker,
  onBack,
  isDismissible,
  ...props
}: StakePositionSurfaceProps): StakePositionSurfaceViewProps {
  const title = useStakePositionTitle(heading, ticker);

  return { ...props, title, isDismissible, onBack: isDismissible ? onBack : undefined };
}
