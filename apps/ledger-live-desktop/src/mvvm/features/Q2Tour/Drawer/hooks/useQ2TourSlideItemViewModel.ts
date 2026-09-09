import {
  useQuarterlyTourSlideItemViewModel,
  type QuarterlyTourSlideItemViewModel,
} from "LLD/components/QuarterlyTour";
import { Q2_TOUR_SLIDES } from "../const";

interface UseQ2TourSlideItemViewModelProps {
  readonly slideIndex: number;
}

export type Q2TourSlideItemViewModel = QuarterlyTourSlideItemViewModel;

export function useQ2TourSlideItemViewModel({
  slideIndex,
}: UseQ2TourSlideItemViewModelProps): Q2TourSlideItemViewModel {
  return useQuarterlyTourSlideItemViewModel({ slideIndex, slides: Q2_TOUR_SLIDES });
}
