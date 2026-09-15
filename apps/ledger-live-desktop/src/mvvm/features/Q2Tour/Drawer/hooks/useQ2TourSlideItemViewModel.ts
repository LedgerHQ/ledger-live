import {
  useReleaseTourSlideItemViewModel,
  type ReleaseTourSlideItemViewModel,
} from "LLD/components/ReleaseTour";
import { Q2_TOUR_SLIDES } from "../const";

interface UseQ2TourSlideItemViewModelProps {
  readonly slideIndex: number;
}

export type Q2TourSlideItemViewModel = ReleaseTourSlideItemViewModel;

export function useQ2TourSlideItemViewModel({
  slideIndex,
}: UseQ2TourSlideItemViewModelProps): Q2TourSlideItemViewModel {
  return useReleaseTourSlideItemViewModel({ slideIndex, slides: Q2_TOUR_SLIDES });
}
